
'use client';

import { useState, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, PackageCheck } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { identifyFoodFromImage, type IdentifyFoodFromImageOutput } from '@/ai/flows/identify-food-from-image-flow';
import { useTheme } from '@/contexts/ThemeContext';

export interface IdentifiedPhotoData {
  name: string;
  ingredients: string;
  portionSize: string;
  portionUnit: string;
}

interface IdentifyFoodByPhotoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFoodIdentified: (data: IdentifiedPhotoData) => void;
}

export default function IdentifyFoodByPhotoDialog({
  isOpen,
  onOpenChange,
  onFoodIdentified,
}: IdentifyFoodByPhotoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoSourceAlertOpen, setIsPhotoSourceAlertOpen] = useState(false);
  const [identifiedData, setIdentifiedData] = useState<IdentifyFoodFromImageOutput | null>(null);
  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetDialogState = () => {
    setIsLoading(false);
    setImagePreview(null);
    setPhotoError(null);
    setIdentifiedData(null);
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleOpenChangeWithReset = (open: boolean) => {
    if (!open) {
      resetDialogState();
    }
    onOpenChange(open);
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImagePreview(null);
    setPhotoError(null);
    setIdentifiedData(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageDataUri = reader.result as string;
      setImagePreview(imageDataUri);
      try {
        const result = await identifyFoodFromImage({ imageDataUri });
        if (result.recognitionSuccess) {
          setIdentifiedData(result);
          toast({ title: "Food Identified!", description: "Review the details below and confirm." });
        } else {
          setPhotoError(result.errorMessage || "Couldn’t recognize this food. Please try another image.");
          toast({ title: "Identification Failed", description: result.errorMessage || "Please try another image.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Error identifying food from image:", err);
        setPhotoError("An error occurred during image analysis. Please try again.");
        toast({ title: "Analysis Error", description: "Could not analyze image.", variant: "destructive" });
      } finally {
        setIsLoading(false);
        if (event.target) event.target.value = ''; // Reset file input
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAndLog = () => {
    if (identifiedData) {
      onFoodIdentified({
        name: identifiedData.identifiedFoodName || 'Unknown Food',
        ingredients: identifiedData.identifiedIngredients || 'Not specified',
        portionSize: identifiedData.estimatedPortionSize || '1',
        portionUnit: identifiedData.estimatedPortionUnit || 'serving',
      });
      handleOpenChangeWithReset(false); // Close and reset dialog
    }
  };

  const cancelClasses = !isDarkMode
    ? "bg-red-200 border-red-300 text-red-700 hover:bg-red-300 hover:border-red-400"
    : "border-accent text-accent-foreground hover:bg-accent/20";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Camera className="mr-2 h-6 w-6 text-gray-400" /> Identify Food by Photo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload or take a picture of your food. We&apos;ll try to identify it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!identifiedData && (
            <AlertDialog open={isPhotoSourceAlertOpen} onOpenChange={setIsPhotoSourceAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" type="button" className="w-full border-primary text-primary hover:bg-primary/10" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Camera className="mr-2 h-5 w-5" />}
                  {isLoading ? 'Analyzing...' : (imagePreview ? 'Change Photo' : 'Select Photo')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Select Photo Source</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose how you want to provide the image of your food.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                  <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                  <AlertDialogAction type="button" onClick={() => cameraInputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Camera className="mr-2 h-4 w-4" /> Take Photo
                  </AlertDialogAction>
                  <AlertDialogAction type="button" onClick={() => uploadInputRef.current?.click()} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleImageFileChange}
            className="hidden"
            disabled={isLoading}
          />
          <input
            type="file"
            accept="image/*"
            ref={uploadInputRef}
            onChange={handleImageFileChange}
            className="hidden"
            disabled={isLoading}
          />

          {imagePreview && (
            <div className="mt-3 border border-input rounded-md p-2 flex justify-center max-h-48 overflow-hidden">
              <Image src={imagePreview} alt="Food preview" width={180} height={180} style={{ objectFit: 'contain' }} className="rounded-md" />
            </div>
          )}

          {isLoading && !imagePreview && (
            <div className="mt-2 text-center text-muted-foreground">
              <Loader2 className="animate-spin h-5 w-5 inline mr-2" /> Please wait...
            </div>
          )}

          {photoError && !isLoading && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Identification Failed</p>
                <p>{photoError}</p>
                 <Button variant="link" className="p-0 h-auto text-xs mt-1 text-destructive hover:underline" onClick={() => {
                    resetDialogState();
                    // Potentially re-trigger the source selection or allow direct upload
                    setIsPhotoSourceAlertOpen(true); 
                }}>Try a different photo</Button>
              </div>
            </div>
          )}

          {identifiedData && !isLoading && (
            <div className="mt-3 p-4 bg-muted/50 border border-input rounded-md space-y-2 text-sm">
              <h3 className="text-base font-semibold text-foreground flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500"/> Identified Details:</h3>
              <p><strong className="text-foreground">Food:</strong> {identifiedData.identifiedFoodName || "N/A"}</p>
              <p><strong className="text-foreground">Ingredients:</strong> {identifiedData.identifiedIngredients || "N/A"}</p>
              <p><strong className="text-foreground">Portion:</strong> {identifiedData.estimatedPortionSize || "N/A"} {identifiedData.estimatedPortionUnit || ""}</p>
              {identifiedData.ocrText && (
                <p className="text-xs"><strong className="text-foreground">OCR Text (partial):</strong> {identifiedData.ocrText.substring(0, 100)}{identifiedData.ocrText.length > 100 ? '...' : ''}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className={cancelClasses} onClick={() => handleOpenChangeWithReset(false)} disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          {identifiedData && !isLoading && (
            <Button onClick={handleConfirmAndLog} className="bg-primary text-primary-foreground hover:bg-primary/80" disabled={isLoading}>
              <PackageCheck className="mr-2 h-5 w-5" /> Confirm & Log Details
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
