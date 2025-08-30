/**
 * Projects API - Create and Generate Concepts
 * 
 * POST /api/projects - Creates a new project and generates 4 concept images
 * 
 * This endpoint handles the core "magic" of Moddo:
 * 1. Creates a new project record in Firestore
 * 2. Calls Google Vertex AI to generate 4 product concept images
 * 3. Analyzes the prompt to generate product specifications
 * 4. Stores everything in Firebase and returns to user
 * 
 * Business Context: This is the first impression users get - it needs to be
 * fast and impressive to demonstrate the product's core value proposition.
 */

import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/lib/firebase';
import { 
  Project, 
  ProjectStatus, 
  ProductSpecs, 
  APIResponse, 
  ConceptGenerationResponse,
  MaterialType 
} from '@/lib/types';

// Initialize Vertex AI for image generation
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID || 'digital-wall-ce229',
  location: 'us-central1',
});

/**
 * Generate Product Specifications from User Prompt
 * Uses AI to extract product requirements and generate realistic specs
 */
function generateProductSpecs(prompt: string): ProductSpecs {
  // In MVP, we'll use heuristics based on common product types
  // In production, this would use an LLM to analyze the prompt
  
  // Default specs - will be refined based on prompt analysis
  let dimensions = { width: 100, height: 50, depth: 20 };
  let material: MaterialType = 'PLA';
  let functionality: string[] = ['Custom designed product'];
  
  // Simple prompt analysis to adjust specs
  const lowerPrompt = prompt.toLowerCase();
  
  // Adjust material based on use case
  if (lowerPrompt.includes('flexible') || lowerPrompt.includes('cable')) {
    material = 'TPU';
  } else if (lowerPrompt.includes('durable') || lowerPrompt.includes('outdoor')) {
    material = 'PETG';
  }
  
  // Adjust size based on product type
  if (lowerPrompt.includes('phone') || lowerPrompt.includes('mobile')) {
    dimensions = { width: 80, height: 150, depth: 15 };
    functionality = ['Phone holder', 'Adjustable viewing angle'];
  } else if (lowerPrompt.includes('organizer') || lowerPrompt.includes('storage')) {
    dimensions = { width: 120, height: 80, depth: 30 };
    functionality = ['Storage compartments', 'Modular design'];
  } else if (lowerPrompt.includes('stand') || lowerPrompt.includes('holder')) {
    dimensions = { width: 100, height: 60, depth: 80 };
    functionality = ['Stable base', 'Ergonomic design'];
  }
  
  // Calculate estimates based on dimensions and material
  const volume = (dimensions.width * dimensions.height * dimensions.depth) / 1000; // cm³
  const materialDensity = material === 'TPU' ? 1.2 : material === 'PETG' ? 1.27 : 1.24; // g/cm³
  const estimatedWeight = Math.round(volume * materialDensity * 0.2); // 20% infill
  const estimatedPrintTime = Math.round(volume * 2.5); // ~2.5 min per cm³
  const materialCostPerGram = material === 'TPU' ? 0.08 : 0.03; // USD per gram
  const estimatedMaterialCost = Math.round((estimatedWeight * materialCostPerGram) * 100) / 100;
  
  return {
    dimensions,
    material,
    estimatedWeight,
    estimatedPrintTime,
    estimatedMaterialCost,
    functionality,
    printSettings: {
      layerHeight: 0.2,
      infillPercentage: 20,
      supportRequired: dimensions.height > dimensions.width * 1.5,
    },
  };
}

/**
 * Generate Concept Images using Vertex AI
 * Creates 4 different angle views of the product concept
 */
async function generateConceptImages(prompt: string): Promise<string[]> {
  try {
    // For MVP, we'll return placeholder images
    // In production, this would call Vertex AI Imagen API
    
    const viewPrompts = [
      `${prompt}, front view, product photography, white background, professional lighting`,
      `${prompt}, back view, product photography, white background, professional lighting`, 
      `${prompt}, side view, product photography, white background, professional lighting`,
      `${prompt}, top view, product photography, white background, professional lighting`
    ];
    
    // Placeholder URLs for MVP - replace with actual Vertex AI generation
    const conceptUrls = [
      'https://via.placeholder.com/400x400/6366f1/ffffff?text=Front+View',
      'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Back+View',
      'https://via.placeholder.com/400x400/06b6d4/ffffff?text=Side+View',
      'https://via.placeholder.com/400x400/10b981/ffffff?text=Top+View'
    ];
    
    // TODO: Replace with actual Vertex AI image generation
    /*
    const model = vertexAI.preview.getGenerativeModel({
      model: 'imagegeneration@005',
    });
    
    const conceptUrls: string[] = [];
    for (const viewPrompt of viewPrompts) {
      const request = {
        contents: [{
          role: 'user',
          parts: [{ text: viewPrompt }]
        }]
      };
      
      const response = await model.generateContent(request);
      // Process response and upload to Firebase Storage
      conceptUrls.push(response.imageUrl);
    }
    */
    
    return conceptUrls;
    
  } catch (error) {
    console.error('Error generating concept images:', error);
    throw new Error('Failed to generate concept images');
  }
}

/**
 * POST /api/projects
 * Creates a new project and generates initial concepts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, userId } = body;
    
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'INVALID_PROMPT',
          message: 'Prompt is required and must be a non-empty string'
        }
      }, { status: 400 });
    }
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'User ID is required'
        }
      }, { status: 400 });
    }
    
    const startTime = Date.now();
    
    // Generate product specifications from the prompt
    const specifications = generateProductSpecs(prompt);
    
    // Create project record in Firestore
    const projectData: Omit<Project, 'id'> = {
      userId,
      prompt: prompt.trim(),
      status: 'generating' as ProjectStatus,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      conceptsGenerated: false,
      modelGenerated: false,
      stlGenerated: false,
      specifications,
      timeSpentRefinining: 0,
      downloadCount: 0,
    };
    
    // Add project to Firestore
    const projectRef = await addDoc(collection(db, 'projects'), projectData);
    const projectId = projectRef.id;
    
    // Generate concept images
    console.log(`Generating concepts for project ${projectId}: "${prompt}"`);
    const conceptImages = await generateConceptImages(prompt);
    
    // Update project with generated concepts
    await updateDoc(projectRef, {
      conceptImages,
      conceptsGenerated: true,
      status: 'concepts',
      updatedAt: serverTimestamp(),
    });
    
    const processingTimeMs = Date.now() - startTime;
    
    // Create response with generated concepts
    const response: ConceptGenerationResponse = {
      projectId,
      concepts: conceptImages.map((imageUrl, index) => ({
        id: uuidv4(),
        projectId,
        index,
        viewName: ['Front View', 'Back View', 'Side View', 'Top View'][index],
        imageUrl,
        imagePrompt: `${prompt}, ${['front', 'back', 'side', 'top'][index]} view`,
        generatedAt: serverTimestamp() as any,
        generationTimeMs: processingTimeMs / 4, // Estimate per image
        imageSize: 0, // Will be filled when we have real images
      })),
      specifications,
      processingTimeMs,
    };
    
    console.log(`Successfully generated concepts for project ${projectId} in ${processingTimeMs}ms`);
    
    return NextResponse.json<APIResponse<ConceptGenerationResponse>>({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate project concepts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
