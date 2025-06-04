
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
  DialogClose, // Added DialogClose
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LoggedFoodItem } from '@/types';
import { Sprout, Loader2, Camera, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BannerAdPlaceholder from '@/components/ads/BannerAdPlaceholder';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { identifyFoodFromImage, type IdentifyFoodFromImageOutput } from '@/ai/flows/identify-food-from-image-flow';
import Image from 'next/image';

const manualEntrySchema = z.object({
  name: z.string().min(1, { message: 'Food name is required' }),
  ingredients: z.string().min(1, { message: 'Ingredients are required (comma-separated)' }),
  portionSize: z.string().min(1, { message: 'Portion size is required (e.g., 1, 0.5, 100)'}),
  portionUnit: z.string().min(1, { message: 'Portion unit is required (e.g., slice, cup, g)'}),
});

export type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface AddFoodItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitFoodItem: (foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType'>) => Promise<void>;
  isEditing?: boolean;
  initialValues?: Partial<ManualEntryFormValues>;
}

export default function AddFoodItemDialog({
  isOpen,
  onOpenChange,
  onSubmitFoodItem,
  isEditing = false,
  initialValues
}: AddFoodItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isIdentifyingPhoto, setIsIdentifyingPhoto] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoSourceAlertOpen, setIsPhotoSourceAlertOpen] = useState(false);

  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-8897507841347789";
  const adSenseSlotIdBanner = "YOUR_BANNER_AD_SLOT_ID_HERE";

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: initialValues || {
      name: '',
      ingredients: '',
      portionSize: '',
      portionUnit: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialValues) {
        form.reset(initialValues);
      } else if (!isEditing) {
        form.reset({ name: '', ingredients: '', portionSize: '', portionUnit: '' });
      }
      // Reset photo-related states when dialog opens/closes or mode changes
      setImagePreview(null);
      setPhotoError(null);
      setIsIdentifyingPhoto(false);
    }
  }, [isOpen, isEditing, initialValues, form]);

  const handleFormSubmit = async (data: ManualEntryFormValues) => {
    setIsLoading(true);
    try {
      await onSubmitFoodItem({
        name: data.name,
        ingredients: data.ingredients,
        portionSize: data.portionSize,
        portionUnit: data.portionUnit,
      });
      if (!isEditing) form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} food item from dialog:`, error);
      toast({ title: 'Error', description: `Could not ${isEditing ? 'update' : 'add'} food item.`, variant: 'destructive' });
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
        if (result.recognitionSuccess && result.identifiedFoodName) {
          form.setValue('name', result.identifiedFoodName);
          if (result.identifiedIngredients) form.setValue('ingredients', result.identifiedIngredients);
          if (result.estimatedPortionSize) form.setValue('portionSize', result.estimatedPortionSize);
          if (result.estimatedPortionUnit) form.setValue('portionUnit', result.estimatedPortionUnit);
          toast({ title: "Food Identified!", description: "Review and confirm the details below." });
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
        // Reset file input value to allow selecting the same file again
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const dialogTitleText = isEditing ? "Edit Food Item" : "Log Food Item";
  const submitButtonText = isLoading
    ? (isEditing ? 'Updating...' : 'Adding...')
    : (isEditing ? 'Update Food Item' : 'Add to Timeline');

  const cancelClasses = !isDarkMode
    ? "bg-red-200 border-red-300 text-red-700 hover:bg-red-300 hover:border-red-400"
    : "border-accent text-accent-foreground hover:bg-accent/20";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Sprout className="mr-2 h-6 w-6 text-gray-400" /> {dialogTitleText}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update the details of this food item." : "Manually add a new food item, or identify it using a photo."}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <BannerAdPlaceholder
            adClientId={adSenseClientId}
            adSlotId={adSenseSlotIdBanner}
          />
        </div>

        {!isEditing && (
          <div className="my-4 space-y-2">
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
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Food Name</Label>
            <Input id="name" {...form.register('name')} placeholder="e.g., Chicken Salad Sandwich" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="portionSize" className="text-sm font-medium text-foreground">Portion Size</Label>
              <Input id="portionSize" {...form.register('portionSize')} placeholder="e.g., 1, 0.5, 100" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
              {form.formState.errors.portionSize && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.portionSize.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="portionUnit" className="text-sm font-medium text-foreground">Portion Unit</Label>
              <Input id="portionUnit" {...form.register('portionUnit')} placeholder="e.g., slice, cup, g" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
              {form.formState.errors.portionUnit && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.portionUnit.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="ingredients" className="text-sm font-medium text-foreground">Ingredients (comma-separated)</Label>
            <Textarea
              id="ingredients"
              {...form.register('ingredients')}
              placeholder="e.g., chicken, lettuce, tomato, mayonnaise, wheat bread"
              className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
            {form.formState.errors.ingredients && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.ingredients.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
             <DialogClose asChild>
              <Button type="button" variant="outline" className={cancelClasses} onClick={() => onOpenChange(false)} disabled={isLoading || isIdentifyingPhoto}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80" disabled={isLoading || isIdentifyingPhoto}>
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
