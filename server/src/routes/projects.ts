import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Project from '../models/Project';
import Donation from '../models/Donation';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { processImages } from '../middleware/imageProcessor';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const projectCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  goal: z.number().positive().optional().nullable(),
  images: z.array(z.string()).max(3, 'Maximum 3 images allowed').optional(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
  branchCode: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
});

const projectUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  goal: z.number().positive().optional().nullable(),
  images: z.array(z.string()).max(3, 'Maximum 3 images allowed').optional(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
  branchCode: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
});

const donationSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Maximum donation is ZAR 1,000,000'),
});

/**
 * GET /api/projects
 * Get all projects (public) with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const { rows: projects, count: total } = await Project.findAndCountAll({
      attributes: ['id', 'title', 'description', 'goal', 'raised', 'images', 'bankName', 'accountNumber', 'accountHolder', 'branchCode', 'reference', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Convert to JSON-serializable format
    const formattedProjects = projects.map((project: any) => {
      // Handle images - it might be a string or already parsed array
      let imagesArray: string[] = [];
      if (project.images) {
        if (Array.isArray(project.images)) {
          imagesArray = project.images;
        } else if (typeof project.images === 'string') {
          try {
            imagesArray = JSON.parse(project.images);
          } catch {
            imagesArray = [];
          }
        }
      }
      
      return {
        id: String(project.id),
        title: String(project.title),
        description: project.description || null,
        goal: project.goal != null ? parseFloat(String(project.goal)) : null,
        raised: parseFloat(String(project.raised)),
        images: imagesArray,
        bankName: project.bankName || null,
        accountNumber: project.accountNumber || null,
        accountHolder: project.accountHolder || null,
        branchCode: project.branchCode || null,
        reference: project.reference || null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });

    return res.json({
      data: formattedProjects,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Get projects error:', error);
    return res.status(500).json({
      error: 'Failed to get projects',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID (public)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      attributes: ['id', 'title', 'description', 'goal', 'raised', 'createdAt', 'updatedAt'],
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        details: 'The requested project does not exist',
      });
    }

    // Get donation count for this project
    const donationCount = await Donation.count({
      where: { projectId: id },
    });

    const formattedProject = {
      id: String(project.id),
      title: String(project.title),
      description: project.description || null,
      goal: project.goal != null ? parseFloat(String(project.goal)) : null,
      raised: parseFloat(String(project.raised)),
      donationCount,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    return res.json(formattedProject);
  } catch (error: any) {
    logger.error('Get project error:', error);
    return res.status(500).json({
      error: 'Failed to get project',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/projects
 * Create a new project (admin only)
 */
router.post('/', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = projectCreateSchema.parse(req.body);

    // Create project
    const project = await Project.create({
      title: validatedData.title,
      description: validatedData.description ?? undefined,
      goal: validatedData.goal ?? undefined,
      raised: 0,
      images: validatedData.images || [], // Will be converted to JSON string by setter
      bankName: validatedData.bankName ?? undefined,
      accountNumber: validatedData.accountNumber ?? undefined,
      accountHolder: validatedData.accountHolder ?? undefined,
      branchCode: validatedData.branchCode ?? undefined,
      reference: validatedData.reference ?? undefined,
    } as any); // Cast to any to allow images array to be set
    
    // Reload to get the properly formatted data
    await project.reload();
    
    // Handle images - it might be a string or already parsed array
    let imagesArray: string[] = [];
    if (project.images) {
      if (Array.isArray(project.images)) {
        imagesArray = project.images;
      } else if (typeof project.images === 'string') {
        try {
          imagesArray = JSON.parse(project.images);
        } catch {
          imagesArray = [];
        }
      }
    }

    const formattedProject = {
      id: String(project.id),
      title: String(project.title),
      description: project.description || null,
      goal: project.goal != null ? parseFloat(String(project.goal)) : null,
      raised: parseFloat(String(project.raised)),
      images: imagesArray,
      bankName: project.bankName || null,
      accountNumber: project.accountNumber || null,
      accountHolder: project.accountHolder || null,
      branchCode: project.branchCode || null,
      reference: project.reference || null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    return res.status(201).json(formattedProject);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Create project error:', error);
    return res.status(500).json({
      error: 'Failed to create project',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/projects/:id
 * Update a project (admin only)
 */
router.patch('/:id', authenticate, requireAdmin, processImages, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate input
    const validatedData = projectUpdateSchema.parse(req.body);

    // Find project
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        details: 'The requested project does not exist',
      });
    }

    // Update project
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description ?? null;
    if (validatedData.goal !== undefined) updateData.goal = validatedData.goal ?? null;
    if (validatedData.images !== undefined) updateData.images = validatedData.images || []; // Will be converted to JSON string by setter
    if (validatedData.bankName !== undefined) updateData.bankName = validatedData.bankName ?? null;
    if (validatedData.accountNumber !== undefined) updateData.accountNumber = validatedData.accountNumber ?? null;
    if (validatedData.accountHolder !== undefined) updateData.accountHolder = validatedData.accountHolder ?? null;
    if (validatedData.branchCode !== undefined) updateData.branchCode = validatedData.branchCode ?? null;
    if (validatedData.reference !== undefined) updateData.reference = validatedData.reference ?? null;

    await project.update(updateData as any); // Cast to any to allow images array
    
    // Reload to get updated data
    await project.reload();

    // Handle images - it might be a string or already parsed array
    let imagesArray: string[] = [];
    if (project.images) {
      if (Array.isArray(project.images)) {
        imagesArray = project.images;
      } else if (typeof project.images === 'string') {
        try {
          imagesArray = JSON.parse(project.images);
        } catch {
          imagesArray = [];
        }
      }
    }

    const formattedProject = {
      id: String(project.id),
      title: String(project.title),
      description: project.description || null,
      goal: project.goal != null ? parseFloat(String(project.goal)) : null,
      raised: parseFloat(String(project.raised)),
      images: imagesArray,
      bankName: project.bankName || null,
      accountNumber: project.accountNumber || null,
      accountHolder: project.accountHolder || null,
      branchCode: project.branchCode || null,
      reference: project.reference || null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    return res.json(formattedProject);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Update project error:', error);
    return res.status(500).json({
      error: 'Failed to update project',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        details: 'The requested project does not exist',
      });
    }

    await project.destroy();

    return res.json({
      message: 'Project deleted successfully',
      id: String(id),
    });
  } catch (error: any) {
    logger.error('Delete project error:', error);
    return res.status(500).json({
      error: 'Failed to delete project',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/projects/:id/donate
 * Make a donation to a project (authenticated users only)
 */
router.post('/:id/donate', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user!.userId;

    // Validate input
    const validatedData = donationSchema.parse(req.body);
    const { amount } = validatedData;

    // Find project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        details: 'The requested project does not exist',
      });
    }

    // Create donation
    const donation = await Donation.create({
      projectId,
      userId,
      amount,
    });

    // Update project raised amount
    const currentRaised = parseFloat(String(project.raised));
    const newRaised = currentRaised + amount;
    await project.update({ raised: newRaised });

    // Get user info for response
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
    });

    const formattedDonation = {
      id: String(donation.id),
      projectId: String(donation.projectId),
      userId: String(donation.userId),
      userName: user?.name || 'Anonymous',
      amount: parseFloat(String(donation.amount)),
      createdAt: donation.createdAt,
    };

    return res.status(201).json({
      donation: formattedDonation,
      project: {
        id: String(project.id),
        title: project.title,
        raised: newRaised,
        goal: project.goal != null ? parseFloat(String(project.goal)) : null,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    logger.error('Donation error:', error);
    return res.status(500).json({
      error: 'Failed to process donation',
      details: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/projects/:id/donations
 * Get all donations for a project (admin only)
 */
router.get('/:id/donations', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        details: 'The requested project does not exist',
      });
    }

    // Get donations with user info
    const donations = await Donation.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const formattedDonations = donations.map((donation: any) => ({
      id: String(donation.id),
      projectId: String(donation.projectId),
      userId: String(donation.userId),
      userName: donation.user?.name || 'Anonymous',
      userEmail: donation.user?.email || null,
      amount: parseFloat(String(donation.amount)),
      createdAt: donation.createdAt,
    }));

    return res.json(formattedDonations);
  } catch (error: any) {
    logger.error('Get donations error:', error);
    return res.status(500).json({
      error: 'Failed to get donations',
      details: error.message || 'Internal server error',
    });
  }
});

export default router;
