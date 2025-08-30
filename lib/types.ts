/**
 * Type Definitions for Moddo MVP
 * 
 * This file defines the core data structures for the Moddo platform:
 * - Projects: User's product creation sessions
 * - Concepts: AI-generated product images and specifications
 * - Feedback: User comments and refinement requests
 * - 3D Models: Generated 3D assets and STL files
 * 
 * Business Context: These types reflect the product workflow from
 * prompt → concept → 3D model → printable file, ensuring type safety
 * and consistent data handling throughout the application.
 */

import { Timestamp } from 'firebase/firestore';

// Project status reflects the user's progress through the Moddo pipeline
export type ProjectStatus = 'generating' | 'concepts' | 'refining' | 'modeling' | 'preview' | 'completed' | 'error';

// Material options for 3D printing - affects cost, durability, and print settings
export type MaterialType = 'PLA' | 'TPU' | 'PETG' | 'ABS';

// Environment contexts for product mockups - helps users visualize usage
export type EnvironmentType = 'desk' | 'shelf' | 'office' | 'kitchen' | 'workshop';

/**
 * User Profile
 * Tracks user authentication and subscription status for monetization
 */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  plan: 'free' | 'paid' | 'enterprise';  // Monetization tiers
  projectsRemaining: number;  // Free tier limits
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

/**
 * Project - Main container for a user's product creation session
 * This represents the entire journey from prompt to printable product
 */
export interface Project {
  id: string;
  userId: string;
  prompt: string;  // Original user input
  status: ProjectStatus;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Generated content references
  conceptsGenerated: boolean;
  selectedConceptIndex?: number;  // Which of the 4 concepts was chosen
  modelGenerated: boolean;
  stlGenerated: boolean;
  
  // File references in Firebase Storage
  conceptImages?: string[];  // URLs to the 4 concept images
  modelFileUrl?: string;     // GLTF model file URL
  stlFileUrl?: string;       // STL file URL for download
  
  // Product specifications (AI-generated)
  specifications?: ProductSpecs;
  
  // Usage analytics for business insights
  timeSpentRefinining?: number;  // Minutes in feedback loop
  downloadCount?: number;        // STL downloads
}

/**
 * Product Specifications - AI-generated product details
 * These specs are created automatically and refined through user feedback
 */
export interface ProductSpecs {
  dimensions: {
    width: number;   // mm
    height: number;  // mm
    depth: number;   // mm
  };
  material: MaterialType;
  estimatedWeight: number;      // grams
  estimatedPrintTime: number;   // minutes
  estimatedMaterialCost: number; // USD
  
  // Functional description
  functionality: string[];      // Array of key features
  printSettings: {
    layerHeight: number;        // mm
    infillPercentage: number;   // %
    supportRequired: boolean;
  };
}

/**
 * Concept - One of the 4 AI-generated product images
 * Each project generates 4 concepts for user to choose from
 */
export interface Concept {
  id: string;
  projectId: string;
  index: number;  // 0-3 (Front, Back, Side, Top)
  viewName: string;  // 'Front View', 'Back View', etc.
  
  // Generated content
  imageUrl: string;           // Firebase Storage URL
  imagePrompt: string;        // Prompt sent to Vertex AI
  generatedAt: Timestamp;
  
  // Quality metrics (for business optimization)
  generationTimeMs: number;
  imageSize: number;  // bytes
}

/**
 * Feedback - User comments and refinement requests
 * This powers the iterative improvement loop that increases user engagement
 */
export interface Feedback {
  id: string;
  projectId: string;
  userId: string;
  
  // Content
  text: string;
  emoji?: string;           // Fun visual element
  type: 'comment' | 'refinement_request' | 'approval';
  
  // Context
  conceptIndex?: number;    // Which concept this feedback relates to
  position?: { x: number; y: number }; // Click position on concept image
  
  // Metadata
  createdAt: Timestamp;
  processed: boolean;       // Has this feedback been incorporated?
  
  // AI processing results
  extractedParameters?: {   // Parameters extracted from natural language
    sizeAdjustment?: 'larger' | 'smaller' | 'wider' | 'taller';
    materialChange?: MaterialType;
    functionalChanges?: string[];
  };
}

/**
 * 3D Model Data - Generated from approved concept images
 * This represents the bridge from concept to physical product
 */
export interface ModelData {
  id: string;
  projectId: string;
  
  // Source data
  sourceConceptIndex: number;  // Which concept was converted
  edgeOneJobId?: string;       // EdgeOne API job tracking
  
  // Generated files
  gltfUrl: string;            // 3D model in GLTF format
  stlUrl?: string;            // Converted STL for printing
  thumbnailUrl?: string;      // Preview image
  
  // Model properties
  vertices: number;
  faces: number;
  fileSize: number;           // bytes
  
  // Processing metadata
  generatedAt: Timestamp;
  conversionTimeMs: number;   // Performance tracking
  
  // Quality checks
  printabilityCheck: {
    passed: boolean;
    issues: string[];         // Thin walls, overhangs, etc.
    recommendations: string[];
  };
}

/**
 * Print Job - For future B2C printing service integration
 * Not implemented in MVP but prepared for monetization expansion
 */
export interface PrintJob {
  id: string;
  projectId: string;
  userId: string;
  
  // Order details
  material: MaterialType;
  quantity: number;
  shippingAddress: any;  // To be defined based on shipping provider
  
  // Pricing
  materialCost: number;
  printingCost: number;
  shippingCost: number;
  totalCost: number;
  
  // Status tracking
  status: 'pending' | 'printing' | 'completed' | 'shipped';
  createdAt: Timestamp;
  estimatedDelivery?: Timestamp;
}

/**
 * API Response Types
 * Standardized responses for all Moddo API endpoints
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ConceptGenerationResponse {
  projectId: string;
  concepts: Concept[];
  specifications: ProductSpecs;
  processingTimeMs: number;
}

export interface ModelGenerationResponse {
  projectId: string;
  modelData: ModelData;
  processingTimeMs: number;
}

export interface STLConversionResponse {
  projectId: string;
  stlUrl: string;
  fileSize: number;
  printabilityCheck: ModelData['printabilityCheck'];
}
