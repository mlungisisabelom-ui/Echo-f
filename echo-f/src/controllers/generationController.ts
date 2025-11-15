import { Request, Response, NextFunction } from 'express';
import Generation from '../models/Generation';
import llmService from '../services/llmService';
import validationService from '../services/validationService';
import deploymentService from '../services/deploymentService';

interface AuthRequest extends Request {
  user?: any;
}

// @desc    Generate code
// @route   POST /api/generation
// @access  Private
export const generateCode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prompt, stack, output } = req.body;
    const userId = req.user.id;

    // Create generation record
    const generation = await Generation.create({
      user: userId,
      prompt,
      stack,
      output,
      status: 'generating'
    });

    // Generate code using AI
    const generationResult = await llmService.generateCode(prompt, stack, output);

    // Validate generated code
    const validationResult = await validationService.validateCode(generationResult.files, stack);

    if (!validationResult.isValid) {
      await Generation.findByIdAndUpdate(generation._id, {
        status: 'failed',
        error: validationResult.errors.join(', ')
      });

      res.status(400).json({
        success: false,
        error: 'Generated code validation failed',
        details: validationResult
      });
      return;
    }

    // Deploy based on output type
    const deploymentResult = await deploymentService.deploy({
      stack,
      output,
      files: generationResult.files
    });

    // Update generation record
    await Generation.findByIdAndUpdate(generation._id, {
      generatedFiles: generationResult.files,
      deploymentUrl: deploymentResult.deploymentUrl,
      downloadUrl: deploymentResult.downloadUrl,
      previewUrl: deploymentResult.previewUrl,
      gitCommitHash: deploymentResult.gitCommitHash,
      installationScript: generationResult.installationScript,
      documentation: generationResult.documentation,
      status: 'completed',
      metadata: {
        tokensUsed: 0, // Would be populated from AI service
        generationTime: Date.now() - generation.createdAt.getTime(),
        modelUsed: 'gpt-4' // Would be dynamic
      }
    });

    res.status(201).json({
      success: true,
      data: {
        generation: {
          id: generation._id,
          prompt,
          stack,
          output,
          status: 'completed',
          deploymentUrl: deploymentResult.deploymentUrl,
          downloadUrl: deploymentResult.downloadUrl,
          previewUrl: deploymentResult.previewUrl,
          gitCommitHash: deploymentResult.gitCommitHash,
          installationScript: generationResult.installationScript,
          documentation: generationResult.documentation,
          files: generationResult.files,
          createdAt: generation.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Generation error: - generationController.ts:93', error);
    res.status(500).json({
      success: false,
      error: 'Code generation failed'
    });
  }
};

// @desc    Get user generations
// @route   GET /api/generation
// @access  Private
export const getUserGenerations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const generations = await Generation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-generatedFiles'); // Exclude large file content

    const total = await Generation.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        generations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get generation by ID
// @route   GET /api/generation/:id
// @access  Private
export const getGenerationById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const generation = await Generation.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!generation) {
      res.status(404).json({
        success: false,
        error: 'Generation not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { generation }
    });
  } catch (error) {
    next(error);
  }
};
