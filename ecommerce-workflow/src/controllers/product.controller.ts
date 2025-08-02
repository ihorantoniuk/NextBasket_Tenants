import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { NotFoundError, asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, PaginatedResponse, Product } from '../types';

export class ProductController {
  constructor(private productService: ProductService) {}

  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const productData = req.body;

    const product = await this.productService.createProduct(tenantId, productData);

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Product created successfully'
    };

    res.status(201).json(response);
  });

  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const product = await this.productService.getProduct(id, tenantId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const response: ApiResponse<Product> = {
      success: true,
      data: product
    };

    res.json(response);
  });

  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { page, limit } = req.query;

    const result = await this.productService.getProducts(tenantId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const response: ApiResponse<PaginatedResponse<Product>> = {
      success: true,
      data: result
    };

    res.json(response);
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const updates = req.body;

    const product = await this.productService.updateProduct(id, tenantId, updates);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Product updated successfully'
    };

    res.json(response);
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const deleted = await this.productService.deleteProduct(id, tenantId);

    if (!deleted) {
      throw new NotFoundError('Product not found');
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Product deleted successfully'
    };

    res.json(response);
  });

  searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { q: searchTerm, page, limit } = req.query;

    const result = await this.productService.searchProducts(
      tenantId,
      searchTerm as string,
      {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      }
    );

    const response: ApiResponse<PaginatedResponse<Product>> = {
      success: true,
      data: result
    };

    res.json(response);
  });

  getAvailableStock = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const availableStock = await this.productService.getAvailableStock(id, tenantId);

    const response: ApiResponse<{ availableStock: number }> = {
      success: true,
      data: { availableStock }
    };

    res.json(response);
  });
}
