import { Product, CreateProductRequest, UpdateProductRequest, PaginationParams, PaginatedResponse } from '../types';
export declare class ProductRepository {
    private getDb;
    private mapRowToProduct;
    create(tenantId: string, productData: CreateProductRequest): Promise<Product>;
    findById(id: string, tenantId: string): Promise<Product | null>;
    findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResponse<Product>>;
    update(id: string, tenantId: string, updates: UpdateProductRequest): Promise<Product | null>;
    delete(id: string, tenantId: string): Promise<boolean>;
    updateStock(productId: string, tenantId: string, quantity: number, operation: 'reserve' | 'release'): Promise<boolean>;
    findByIds(productIds: string[], tenantId: string): Promise<Product[]>;
}
//# sourceMappingURL=product.repository.d.ts.map