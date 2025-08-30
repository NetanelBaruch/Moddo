/**
 * Feedback API - Handle User Feedback and Concept Refinements
 * 
 * POST /api/projects/[id]/feedback - Add feedback to a project
 * GET /api/projects/[id]/feedback - Get all feedback for a project
 * 
 * This endpoint manages the feedback loop that allows users to refine
 * their product concepts through natural language comments. This is
 * crucial for user engagement and getting to the perfect design.
 * 
 * Business Context: The feedback loop is what differentiates Moddo from
 * static design tools - users can iterate until they're happy, which
 * increases conversion rates and user satisfaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/lib/firebase';
import { Feedback, APIResponse, MaterialType, Project } from '@/lib/types';

/**
 * Extract Parameters from Natural Language Feedback
 * Analyzes user feedback to identify actionable refinement requests
 */
function extractFeedbackParameters(feedbackText: string): Feedback['extractedParameters'] {
  const lowerText = feedbackText.toLowerCase();
  const parameters: Feedback['extractedParameters'] = {};
  
  // Size adjustments
  if (lowerText.includes('bigger') || lowerText.includes('larger') || lowerText.includes('increase size')) {
    parameters.sizeAdjustment = 'larger';
  } else if (lowerText.includes('smaller') || lowerText.includes('reduce size') || lowerText.includes('compact')) {
    parameters.sizeAdjustment = 'smaller';
  } else if (lowerText.includes('wider') || lowerText.includes('broader')) {
    parameters.sizeAdjustment = 'wider';
  } else if (lowerText.includes('taller') || lowerText.includes('higher')) {
    parameters.sizeAdjustment = 'taller';
  }
  
  // Material changes
  if (lowerText.includes('flexible') || lowerText.includes('rubbery') || lowerText.includes('tpu')) {
    parameters.materialChange = 'TPU';
  } else if (lowerText.includes('rigid') || lowerText.includes('hard') || lowerText.includes('pla')) {
    parameters.materialChange = 'PLA';
  } else if (lowerText.includes('durable') || lowerText.includes('strong') || lowerText.includes('petg')) {
    parameters.materialChange = 'PETG';
  } else if (lowerText.includes('abs')) {
    parameters.materialChange = 'ABS';
  }
  
  // Functional changes
  const functionalChanges: string[] = [];
  if (lowerText.includes('hole') || lowerText.includes('opening')) {
    functionalChanges.push('Add holes or openings');
  }
  if (lowerText.includes('grip') || lowerText.includes('texture')) {
    functionalChanges.push('Add grip texture');
  }
  if (lowerText.includes('compartment') || lowerText.includes('section')) {
    functionalChanges.push('Add compartments');
  }
  if (lowerText.includes('smooth') || lowerText.includes('rounded')) {
    functionalChanges.push('Smooth edges');
  }
  
  if (functionalChanges.length > 0) {
    parameters.functionalChanges = functionalChanges;
  }
  
  return Object.keys(parameters).length > 0 ? parameters : undefined;
}

/**
 * Determine Feedback Type from Content
 * Categorizes feedback to help with processing and analytics
 */
function determineFeedbackType(feedbackText: string): Feedback['type'] {
  const lowerText = feedbackText.toLowerCase();
  
  // Check for approval indicators
  if (lowerText.includes('perfect') || lowerText.includes('looks good') || 
      lowerText.includes('approve') || lowerText.includes('ready')) {
    return 'approval';
  }
  
  // Check for refinement requests (actionable feedback)
  if (lowerText.includes('change') || lowerText.includes('adjust') ||
      lowerText.includes('make it') || lowerText.includes('need') ||
      lowerText.includes('should be') || lowerText.includes('add') ||
      lowerText.includes('remove')) {
    return 'refinement_request';
  }
  
  // Default to general comment
  return 'comment';
}

/**
 * POST /api/projects/[id]/feedback
 * Add new feedback to a project
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { text, userId, conceptIndex, position, emoji } = body;
    
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'INVALID_FEEDBACK',
          message: 'Feedback text is required'
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
    
    // Verify project exists and belongs to user
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      }, { status: 404 });
    }
    
    const projectData = projectSnap.data() as Project;
    if (projectData.userId !== userId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User does not own this project'
        }
      }, { status: 403 });
    }
    
    // Analyze feedback text to extract parameters
    const extractedParameters = extractFeedbackParameters(text);
    const feedbackType = determineFeedbackType(text);
    
    // Create feedback record
    const feedbackData: Omit<Feedback, 'id'> = {
      projectId,
      userId,
      text: text.trim(),
      emoji: emoji || '💭',
      type: feedbackType,
      conceptIndex: typeof conceptIndex === 'number' ? conceptIndex : undefined,
      position: position || undefined,
      createdAt: serverTimestamp() as any,
      processed: false,
      extractedParameters,
    };
    
    // Add feedback to Firestore
    const feedbackRef = await addDoc(collection(db, 'feedback'), feedbackData);
    const feedbackId = feedbackRef.id;
    
    // Update project status if this is a refinement request
    if (feedbackType === 'refinement_request') {
      await updateDoc(projectRef, {
        status: 'refining',
        updatedAt: serverTimestamp(),
      });
    }
    
    // Log the feedback for analytics
    console.log(`New ${feedbackType} feedback added to project ${projectId}:`, {
      feedbackId,
      text: text.substring(0, 100),
      extractedParameters,
      conceptIndex,
    });
    
    return NextResponse.json<APIResponse<{ feedbackId: string; extractedParameters?: any }>>({
      success: true,
      data: {
        feedbackId,
        extractedParameters
      }
    });
    
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/feedback:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'FEEDBACK_FAILED',
        message: 'Failed to add feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/projects/[id]/feedback
 * Get all feedback for a project
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'User ID is required'
        }
      }, { status: 400 });
    }
    
    // Verify project exists and belongs to user
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      }, { status: 404 });
    }
    
    const projectData = projectSnap.data() as Project;
    if (projectData.userId !== userId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User does not own this project'
        }
      }, { status: 403 });
    }
    
    // Get all feedback for this project, ordered by creation time
    const feedbackQuery = query(
      collection(db, 'feedback'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );
    
    const feedbackSnap = await getDocs(feedbackQuery);
    const feedback: (Feedback & { id: string })[] = [];
    
    feedbackSnap.forEach((doc) => {
      feedback.push({
        ...(doc.data() as Omit<Feedback, 'id'>),
        id: doc.id
      });
    });
    
    console.log(`Retrieved ${feedback.length} feedback items for project ${projectId}`);
    
    return NextResponse.json<APIResponse<{ feedback: (Feedback & { id: string })[] }>>({
      success: true,
      data: { feedback }
    });
    
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/feedback:', error);
    
    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'FEEDBACK_RETRIEVAL_FAILED',
        message: 'Failed to retrieve feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
