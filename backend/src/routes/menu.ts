import express from 'express';
import { prisma, io } from '../index';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { MenuItemStatus } from '@prisma/client';
import { MenuItemCategory } from '@prisma/client';

const router = express.Router();

// Get all menu items (public endpoint)
router.get('/', async (req, res, next) => {
  try {
    const { category, available, limit, offset } = req.query;
    
    const where: any = {};
    
    if (category) {
      where.category = category as MenuItemCategory;
    }
    
    if (available !== undefined) {
      where.status = available === 'true' ? "AVAILABLE" : "UNAVAILABLE";
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
        status: true,
        preparationTime: true,
        dietaryRestrictions: true,
        allergens: true,
        stockQuantity: true,
        updatedAt: true

      },
      orderBy: { name: 'asc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: { menuItems }
    });
  } catch (error) {
    next(error);
  }
});

// Get single menu item
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      
    });

    if (!menuItem) {
      throw createError('Menu item not found', 404);
    }

    res.json({
      success: true,
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
});

// Create menu item (admin only)
router.post('/', 
  authenticateToken, 
  requirePermission('manage_menu'), 
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const {
        name,
        description,
        price,
        category,
        imageUrl,
        preparationTime,
        allergens,
        stockLevel
      } = req.body;

      if (!name || !price || !category) {
        throw createError('Name, price, and category are required', 400);
      }

      // Create menu item with availability
      const menuItem = await prisma.$transaction(async (tx) => {
        const item = await tx.menuItem.create({
          data: {
            name,
            description,
            price: parseFloat(price),
            category: category as MenuItemCategory,
            imageUrl,
            preparationTime: preparationTime ? parseInt(preparationTime) : 0,
            allergens,
            status: "AVAILABLE",
            stockQuantity: stockLevel || 0
          }
        });

        return item;
      });

      // Log menu item creation
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'MENU_ITEM_CREATED',
          userId: req.user!.id,
          context: { menuItemId: menuItem.id, name: menuItem.name }
        }
      });

      // Broadcast menu update to all connected clients
      io.emit('menu-updated', { 
        action: 'item-added',
        item: menuItem 
      });

      res.status(201).json({
        success: true,
        data: { menuItem }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update menu item (admin only)
router.put('/:id',
  authenticateToken,
  requirePermission('manage_menu'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be directly updated
      delete updateData.id;
      delete updateData.createdAt;

      if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
      }

      if (updateData.preparationTime) {
        updateData.preparationTime = parseInt(updateData.preparationTime);
      }

      const menuItem = await prisma.menuItem.update({
        where: { id },
        data: updateData,
      });

      // Log menu item update
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'MENU_ITEM_UPDATED',
          userId: req.user!.id,
          context: { menuItemId: id, changes: updateData }
        }
      });

      // Broadcast menu update
      io.emit('menu-updated', { 
        action: 'item-updated',
        item: menuItem 
      });

      res.json({
        success: true,
        data: { menuItem }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update item availability/stock
router.patch('/:id/availability',
  authenticateToken,
  requirePermission('manage_inventory'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const { stockLevel, isAvailable } = req.body;

      const availability = await prisma.menuItem.update({
        where: { id },
        data: {
          stockQuantity: stockLevel !== undefined ? parseInt(stockLevel) : undefined,
          status: isAvailable !== undefined ? isAvailable : undefined,
          updatedAt: new Date()
        }
      });

      // Update menu item status if needed
      if (isAvailable !== undefined) {
        await prisma.menuItem.update({
          where: { id },
          data: {
            status: isAvailable ? MenuItemStatus.AVAILABLE : MenuItemStatus.OUT_OF_STOCK
          }
        });
      }

      // Log inventory update
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'INVENTORY_UPDATED',
          userId: req.user!.id,
          context: { 
            menuItemId: id, 
            stockQuantity: availability.stockQuantity,
            status: availability.status 
          }
        }
      });

      // Broadcast availability update
      io.emit('inventory-updated', {
        menuItemId: id,
        availability
      });

      res.json({
        success: true,
        data: { availability }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk update stock levels
router.patch('/bulk/availability',
  authenticateToken,
  requirePermission('manage_inventory'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { updates } = req.body; // Array of { menuItemId, stockLevel, isAvailable }

      if (!Array.isArray(updates)) {
        throw createError('Updates must be an array', 400);
      }

      const results = await prisma.$transaction(
        updates.map(update => 
          prisma.menuItem.update({
            where: { id: update.menuItemId },
            data: {
              stockQuantity: update.stockLevel !== undefined ? parseInt(update.stockLevel) : undefined,
              status: update.isAvailable !== undefined ? update.isAvailable : undefined,
              updatedAt: new Date()
            }
          })
        )
      );

      // Log bulk update
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'BULK_INVENTORY_UPDATE',
          userId: req.user!.id,
          context: { updatedItems: updates.length }
        }
      });

      // Broadcast bulk update
      io.emit('inventory-bulk-updated', { updates: results });

      res.json({
        success: true,
        data: { updatedCount: results.length }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete menu item (admin only)
router.delete('/:id',
  authenticateToken,
  requirePermission('manage_menu'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      // Check if item exists and get its name for logging
      const existingItem = await prisma.menuItem.findUnique({
        where: { id },
        select: { name: true }
      });

      if (!existingItem) {
        throw createError('Menu item not found', 404);
      }

      // Delete menu item (cascade will handle availability)
      await prisma.menuItem.delete({
        where: { id }
      });

      // Log deletion
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'MENU_ITEM_DELETED',
          userId: req.user!.id,
          context: { menuItemId: id, name: existingItem.name }
        }
      });

      // Broadcast deletion
      io.emit('menu-updated', { 
        action: 'item-deleted',
        itemId: id 
      });

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

// TODO: Add menu item categories management
// TODO: Implement seasonal menu items with automatic activation/deactivation
// TODO: Add bulk import/export functionality for menu items
// TODO: Implement menu item recommendations based on popularity
// TODO: Add nutritional information validation and calculations