
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
import { Label } from '@/components/ui/label';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, PackageCheck, Library, ImageUp, Info } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { identifyFoodFromImage, type IdentifyFoodFromImageOutput } from '@/ai/flows/identify-food-from-image-flow';
import { useTheme } from '@/contexts/ThemeContext';
import { ScrollArea } from '@/components/ui/scroll-area'; 

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
        console.log('AI Image Identification Result:', result);
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
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Camera className="mr-2 h-6 w-6 text-gray-400" /> Identify Food by Photo
          </DialogTitle>
          {!imagePreview && !identifiedData && !photoError && (
            <DialogDescription className="text-muted-foreground">
              Choose a photo of your food item.
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 py-4 px-1">
            {!imagePreview && !identifiedData && !isLoading && !photoError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" type="button" className="w-full border-primary text-primary hover:bg-primary/10 py-6 text-base" onClick={() => cameraInputRef.current?.click()} disabled={isLoading}>
                  <Camera className="mr-2 h-5 w-5" /> Take Photo
                </Button>
                <Button variant="outline" type="button" className="w-full border-primary text-primary hover:bg-primary/10 py-6 text-base" onClick={() => uploadInputRef.current?.click()} disabled={isLoading}>
                  <Library className="mr-2 h-5 w-5" /> From Library
                </Button>
              </div>
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
            {isLoading && (
              <div className="mt-2 text-center text-muted-foreground flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 inline mr-2" /> {imagePreview ? "Analyzing..." : "Processing..."}
              </div>
            )}


            {photoError && !isLoading && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md flex flex-col items-center text-center">
                <AlertTriangle className="h-6 w-6 mb-2 shrink-0" />
                <div>
                  <p className="font-semibold">Identification Failed</p>
                  <p className="mb-2">{photoError}</p>
                  <Button variant="outline" className="text-xs mt-1 text-destructive hover:underline" onClick={() => {
                      resetDialogState();
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
                <p className={cn("text-xs pt-2 flex items-start gap-1.5", "text-muted-foreground")}>
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>If details aren't perfect, you can edit them from the meal card on your dashboard after logging.</span>
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-2 mt-auto shrink-0">
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
