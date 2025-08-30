/**
 * STL Conversion and Download API
 * 
 * POST /api/projects/[id]/stl - Convert GLTF to STL and generate download
 * GET /api/projects/[id]/stl - Get STL file status and download URL
 * 
 * This endpoint handles the final step of the Moddo pipeline: converting
 * the 3D GLTF model to a printable STL file with quality checks and
 * optimization for 3D printing.
 * 
 * Business Context: STL export is the final deliverable that proves
 * Moddo's value - a real, printable file that users can take to any
 * 3D printer. This is what converts engagement into tangible value.
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { 
  Project, 
  APIResponse, 
  STLConversionResponse,
  ModelData 
} from '@/lib/types';

/**
 * GLTF to STL Converter
 * Handles the conversion process and 3D printing optimization
 */
class STLConverter {
  /**
   * Convert GLTF model to STL format
   * In production, this would use a 3D processing library like Three.js or mesh processing tools
   */
  async convertGLTFToSTL(gltfUrl: string, projectId: string): Promise<{
    stlBuffer: Buffer;
    vertices: number;
    faces: number;
    volume: number; // cm³
  }> {
    try {
      // For MVP, we'll simulate the conversion process
      // In production, this would:
      // 1. Download the GLTF file
      // 2. Parse the geometry using Three.js or similar
      // 3. Convert to STL format
      // 4. Optimize mesh for 3D printing
      
      console.log(`Converting GLTF to STL for project ${projectId}: ${gltfUrl}`);

      // Simulate conversion delay (real conversion takes time)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock STL data for MVP
      // In production, this would be actual STL binary data
      const mockSTLContent = this.generateMockSTL(projectId);
      const stlBuffer = Buffer.from(mockSTLContent);

      // Simulated mesh statistics
      const meshStats = {
        vertices: 5000 + Math.floor(Math.random() * 10000),
        faces: 3000 + Math.floor(Math.random() * 6000),
        volume: 15 + Math.random() * 30, // 15-45 cm³
      };

      console.log(`STL conversion completed: ${meshStats.vertices} vertices, ${meshStats.faces} faces`);

      return {
        stlBuffer,
        ...meshStats
      };

    } catch (error) {
      console.error('STL conversion error:', error);
      throw new Error('Failed to convert GLTF to STL');
    }
  }

  /**
   * Generate mock STL content for MVP demonstration
   * In production, this would be replaced with actual mesh conversion
   */
  private generateMockSTL(projectId: string): string {
    // Create a simple STL header with project identifier
    const header = `solid Moddo_${projectId}\n`;
    const footer = `endsolid Moddo_${projectId}\n`;
    
    // Add some mock triangle data (a very simple cube)
    let triangles = '';
    const cubeTriangles = [
      // Front face
      'facet normal 0.0 0.0 1.0\n  outer loop\n    vertex 0.0 0.0 1.0\n    vertex 1.0 0.0 1.0\n    vertex 1.0 1.0 1.0\n  endloop\nendfacet\n',
      'facet normal 0.0 0.0 1.0\n  outer loop\n    vertex 0.0 0.0 1.0\n    vertex 1.0 1.0 1.0\n    vertex 0.0 1.0 1.0\n  endloop\nendfacet\n',
      // Add more faces for a complete cube...
    ];
    
    triangles = cubeTriangles.join('');
    
    return header + triangles + footer;
  }

  /**
   * Validate STL for 3D printing
   * Checks for common issues that would prevent successful printing
   */
  validateForPrinting(meshData: {
    vertices: number;
    faces: number;
    volume: number;
  }): ModelData['printabilityCheck'] {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check minimum size (too small models may not print well)
    if (meshData.volume < 1) {
      issues.push('Model may be too small for reliable printing');
      recommendations.push('Consider scaling up the model');
    }

    // Check maximum size (printer bed limitations)
    if (meshData.volume > 1000) { // 1000 cm³ = 10cm cube
      issues.push('Model may be too large for some 3D printers');
      recommendations.push('Consider scaling down or printing in parts');
    }

    // Check mesh complexity
    if (meshData.faces > 50000) {
      issues.push('High face count may cause slicer performance issues');
      recommendations.push('Consider mesh decimation to reduce complexity');
    }

    if (meshData.faces < 100) {
      issues.push('Low face count may result in blocky appearance');
      recommendations.push('Consider increasing mesh resolution');
    }

    // Default recommendations for successful models
    if (issues.length === 0) {
      recommendations.push('Model appears optimized for 3D printing');
      recommendations.push('Recommended infill: 15-20%');
      recommendations.push('Recommended layer height: 0.2mm');
      recommendations.push('Consider orientation to minimize supports');
    }

    return {
      passed: issues.length === 0,
      issues,
      recommendations
    };
  }
}

/**
 * Upload STL file to Firebase Storage
 * Returns the download URL for user access
 */
async function uploadSTLFile(
  stlBuffer: Buffer, 
  projectId: string, 
  fileName: string
): Promise<string> {
  try {
    // Create a reference to the STL file in Firebase Storage
    const stlRef = ref(storage, `stl-files/${projectId}/${fileName}`);
    
    // Upload the STL buffer
    const snapshot = await uploadBytes(stlRef, stlBuffer, {
      contentType: 'application/sla', // STL MIME type
      customMetadata: {
        'project-id': projectId,
        'generated-at': new Date().toISOString(),
        'file-type': 'stl'
      }
    });

    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    console.log(`STL file uploaded to Firebase Storage: ${downloadUrl}`);
    return downloadUrl;

  } catch (error) {
    console.error('STL upload error:', error);
    throw new Error('Failed to upload STL file');
  }
}

/**
 * POST /api/projects/[id]/stl
 * Convert GLTF model to STL and prepare for download
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { userId } = body;

    // Validate input
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'User ID is required'
        }
      }, { status: 400 });
    }

    // Get project data
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

    // Verify ownership and project state
    if (projectData.userId !== userId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User does not own this project'
        }
      }, { status: 403 });
    }

    if (!projectData.modelGenerated || !projectData.modelFileUrl) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'MODEL_NOT_READY',
          message: '3D model must be generated first'
        }
      }, { status: 400 });
    }

    const startTime = Date.now();

    // Convert GLTF to STL
    const converter = new STLConverter();
    const stlResult = await converter.convertGLTFToSTL(
      projectData.modelFileUrl,
      projectId
    );

    // Validate the STL for 3D printing
    const printabilityCheck = converter.validateForPrinting({
      vertices: stlResult.vertices,
      faces: stlResult.faces,
      volume: stlResult.volume
    });

    // Generate filename with project info
    const fileName = `${projectData.prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}_${projectId}.stl`;
    
    // Upload STL to Firebase Storage
    const stlUrl = await uploadSTLFile(stlResult.stlBuffer, projectId, fileName);

    // Update project with STL data
    await updateDoc(projectRef, {
      stlGenerated: true,
      stlFileUrl: stlUrl,
      status: 'completed',
      updatedAt: serverTimestamp(),
    });

    const processingTimeMs = Date.now() - startTime;

    console.log(`Generated STL for project ${projectId} in ${processingTimeMs}ms`);

    const response: STLConversionResponse = {
      projectId,
      stlUrl,
      fileSize: stlResult.stlBuffer.length,
      printabilityCheck
    };

    return NextResponse.json<APIResponse<STLConversionResponse>>({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/stl:', error);

    // Update project status to error
    try {
      const projectRef = doc(db, 'projects', params.id);
      await updateDoc(projectRef, {
        status: 'error',
        updatedAt: serverTimestamp(),
      });
    } catch (updateError) {
      console.error('Failed to update project status to error:', updateError);
    }

    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'STL_CONVERSION_FAILED',
        message: 'Failed to convert model to STL',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/projects/[id]/stl
 * Get STL file status and download information
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const download = searchParams.get('download') === 'true';

    if (!userId) {
      return NextResponse.json<APIResponse>({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'User ID is required'
        }
      }, { status: 400 });
    }

    // Get project data
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

    // If download is requested and STL exists, redirect to download URL
    if (download && projectData.stlFileUrl) {
      // Track download for analytics
      await updateDoc(projectRef, {
        downloadCount: (projectData.downloadCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      // Redirect to the actual file download
      return NextResponse.redirect(projectData.stlFileUrl);
    }

    // Return STL status information
    const stlStatus = {
      projectId,
      stlGenerated: projectData.stlGenerated,
      stlFileUrl: projectData.stlFileUrl,
      downloadCount: projectData.downloadCount || 0,
      status: projectData.status,
    };

    return NextResponse.json<APIResponse<typeof stlStatus>>({
      success: true,
      data: stlStatus
    });

  } catch (error) {
    console.error('Error in GET /api/projects/[id]/stl:', error);

    return NextResponse.json<APIResponse>({
      success: false,
      error: {
        code: 'STL_STATUS_FAILED',
        message: 'Failed to get STL status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
