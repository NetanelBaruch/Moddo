/**
 * Custom React Hooks for Moddo MVP
 * 
 * This file provides reusable hooks for managing API calls, project state,
 * and user interactions throughout the Moddo application. These hooks
 * abstract the complexity of API calls and provide clean state management.
 * 
 * Business Context: These hooks ensure consistent error handling, loading
 * states, and data flow throughout the application, creating a smooth
 * user experience that's crucial for demonstrating the product's value.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Project, 
  ConceptGenerationResponse, 
  ModelGenerationResponse,
  STLConversionResponse,
  APIResponse,
  Feedback 
} from './types';

/**
 * Hook for managing project creation and concept generation
 * Handles the core "magic" moment of turning prompts into concepts
 */
export function useProjectGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<ConceptGenerationResponse | null>(null);

  /**
   * Generate a new project with concepts from a user prompt
   * This is the primary entry point for the Moddo experience
   */
  const generateProject = useCallback(async (prompt: string, userId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, userId }),
      });

      const result: APIResponse<ConceptGenerationResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate concepts');
      }

      setCurrentProject(result.data!);
      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Project generation error:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateProject,
    isGenerating,
    error,
    currentProject,
    setCurrentProject,
  };
}

/**
 * Hook for managing feedback and comments on concepts
 * Handles the interactive refinement loop that engages users
 */
export function useFeedback(projectId: string, userId: string) {
  const [feedback, setFeedback] = useState<(Feedback & { id: string })[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load existing feedback for the project
   */
  const loadFeedback = useCallback(async () => {
    if (!projectId || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/feedback?userId=${userId}`);
      const result: APIResponse<{ feedback: (Feedback & { id: string })[] }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load feedback');
      }

      setFeedback(result.data!.feedback);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feedback';
      setError(errorMessage);
      console.error('Feedback loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, userId]);

  /**
   * Submit new feedback for a concept
   */
  const submitFeedback = useCallback(async (
    text: string, 
    conceptIndex?: number, 
    position?: { x: number; y: number },
    emoji?: string
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          userId,
          conceptIndex,
          position,
          emoji,
        }),
      });

      const result: APIResponse<{ feedbackId: string; extractedParameters?: any }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit feedback');
      }

      // Reload feedback to get the updated list
      await loadFeedback();

      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      console.error('Feedback submission error:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [projectId, userId, loadFeedback]);

  // Load feedback on mount and when dependencies change
  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return {
    feedback,
    isSubmitting,
    isLoading,
    error,
    submitFeedback,
    loadFeedback,
  };
}

/**
 * Hook for managing 3D model generation from concepts
 * Handles the crucial step from 2D concepts to 3D models
 */
export function useModelGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelData, setModelData] = useState<ModelGenerationResponse | null>(null);

  /**
   * Generate 3D model from approved concept
   */
  const generateModel = useCallback(async (projectId: string, userId: string, conceptIndex: number) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, conceptIndex }),
      });

      const result: APIResponse<ModelGenerationResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate 3D model');
      }

      setModelData(result.data!);
      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate 3D model';
      setError(errorMessage);
      console.error('Model generation error:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateModel,
    isGenerating,
    error,
    modelData,
    setModelData,
  };
}

/**
 * Hook for managing STL conversion and download
 * Handles the final step to get a printable file
 */
export function useSTLConversion() {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stlData, setSTLData] = useState<STLConversionResponse | null>(null);

  /**
   * Convert 3D model to STL format
   */
  const convertToSTL = useCallback(async (projectId: string, userId: string) => {
    setIsConverting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/stl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result: APIResponse<STLConversionResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to convert to STL');
      }

      setSTLData(result.data!);
      return result.data!;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert to STL';
      setError(errorMessage);
      console.error('STL conversion error:', err);
      throw err;
    } finally {
      setIsConverting(false);
    }
  }, []);

  /**
   * Get download URL for STL file
   */
  const getDownloadUrl = useCallback((projectId: string, userId: string) => {
    return `/api/projects/${projectId}/stl?userId=${userId}&download=true`;
  }, []);

  return {
    convertToSTL,
    isConverting,
    error,
    stlData,
    getDownloadUrl,
  };
}

/**
 * Hook for managing overall project state and navigation
 * Provides a centralized way to track progress through the Moddo pipeline
 */
export function useProjectFlow() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('demo-user'); // For MVP, use demo user

  /**
   * Navigate to a specific step in the flow
   */
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  }, []);

  /**
   * Move to the next step in the flow
   */
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, []);

  /**
   * Move to the previous step in the flow
   */
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  /**
   * Reset the flow to the beginning
   */
  const resetFlow = useCallback(() => {
    setCurrentStep(1);
    setProjectId(null);
  }, []);

  /**
   * Calculate progress percentage for UI display
   */
  const progressPercentage = (currentStep / 4) * 100;

  return {
    currentStep,
    projectId,
    userId,
    progressPercentage,
    setProjectId,
    setUserId,
    setCurrentStep,
    goToStep,
    nextStep,
    prevStep,
    resetFlow,
  };
}

/**
 * Hook for handling async operations with loading and error states
 * Provides a consistent pattern for API calls throughout the app
 */
export function useAsyncOperation<T>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  /**
   * Execute an async operation with automatic loading and error handling
   */
  const execute = useCallback(async (operation: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear the current state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    reset,
    isLoading,
    error,
    data,
  };
}
