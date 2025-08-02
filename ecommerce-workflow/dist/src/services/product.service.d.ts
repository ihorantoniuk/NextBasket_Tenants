import { ProductRepository } from '../repositories/product.repository';
import { Product, CreateProductRequest, UpdateProductRequest, PaginationParams, PaginatedResponse } from '../types';
export declare class ProductService {
    private productRepository;
    private cartRepository;
    constructor(productRepository: ProductRepository);
    createProduct(tenantId: string, productData: CreateProductRequest): Promise<Product>;
    getProduct(id: string, tenantId: string): Promise<Product | null>;
    getProducts(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>>;
    updateProduct(id: string, tenantId: string, updates: UpdateProductRequest): Promise<Product | null>;
    deleteProduct(id: string, tenantId: string): Promise<boolean>;
    checkStock(productId: string, tenantId: string, requiredQuantity: number): Promise<boolean>;
    getAvailableStock(productId: string, tenantId: string): Promise<number>;
    reserveStock(productId: string, tenantId: string, quantity: number): Promise<boolean>;
    releaseStock(productId: string, tenantId: string, quantity: number): Promise<boolean>;
    getProductsByIds(productIds: string[], tenantId: string): Promise<Product[]>;
    searchProducts(tenantId: string, searchTerm: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>>;
}
//# sourceMappingURL=product.service.d.ts.map