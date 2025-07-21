import { Category, CategoryDTO, CreateCategoryDTO, UpdateCategoryDTO } from '../models/category.model';
import { CategoryRepository } from '../repositories/category.repository';
import CacheService, { CACHE_TTL, CACHE_KEYS } from './cache.service';

/**
 * Service for category-related operations
 */
export class CategoryService {
  /**
   * Get all categories with caching
   * @returns Promise resolving to array of categories
   */
  static async getAllCategories(): Promise<CategoryDTO[]> {
    // Try to get from cache first
    const cacheKey = CacheService.getCategoriesKey();
    const cachedCategories = await CacheService.get<CategoryDTO[]>(cacheKey);
    
    if (cachedCategories) {
      return cachedCategories;
    }
    
    // If not in cache, get from database
    const categories = await CategoryRepository.findAll();
    const categoryDTOs = categories.map(this.mapToDTO);
    
    // Store in cache
    await CacheService.set(cacheKey, categoryDTOs, CACHE_TTL.CATEGORIES);
    
    return categoryDTOs;
  }

  /**
   * Get categories by type with caching
   * @param type Category type (income or expense)
   * @returns Promise resolving to array of categories
   */
  static async getCategoriesByType(type: 'income' | 'expense'): Promise<CategoryDTO[]> {
    // Try to get from cache first
    const cacheKey = `${CacheService.getCategoriesKey()}:${type}`;
    const cachedCategories = await CacheService.get<CategoryDTO[]>(cacheKey);
    
    if (cachedCategories) {
      return cachedCategories;
    }
    
    // If not in cache, get from database
    const categories = await CategoryRepository.findByType(type);
    const categoryDTOs = categories.map(this.mapToDTO);
    
    // Store in cache
    await CacheService.set(cacheKey, categoryDTOs, CACHE_TTL.CATEGORIES);
    
    return categoryDTOs;
  }

  /**
   * Get category by ID
   * @param id Category ID
   * @returns Promise resolving to category or null if not found
   */
  static async getCategoryById(id: number): Promise<CategoryDTO | null> {
    const category = await CategoryRepository.findById(id);
    return category ? this.mapToDTO(category) : null;
  }

  /**
   * Create a new category (admin only)
   * @param data Category data
   * @returns Promise resolving to created category
   */
  static async createCategory(data: CreateCategoryDTO): Promise<CategoryDTO> {
    const category = await CategoryRepository.create(data);
    
    // Invalidate categories cache
    await this.invalidateCategoriesCache();
    
    return this.mapToDTO(category);
  }

  /**
   * Update an existing category (admin only)
   * @param id Category ID
   * @param data Category data to update
   * @returns Promise resolving to updated category or null if not found
   */
  static async updateCategory(id: number, data: UpdateCategoryDTO): Promise<CategoryDTO | null> {
    const category = await CategoryRepository.update(id, data);
    
    if (!category) {
      return null;
    }
    
    // Invalidate categories cache
    await this.invalidateCategoriesCache();
    
    return this.mapToDTO(category);
  }

  /**
   * Delete a category (admin only)
   * @param id Category ID
   * @returns Promise resolving to boolean indicating success
   */
  static async deleteCategory(id: number): Promise<boolean> {
    const result = await CategoryRepository.delete(id);
    
    if (result) {
      // Invalidate categories cache
      await this.invalidateCategoriesCache();
    }
    
    return result;
  }

  /**
   * Invalidate all category-related caches
   */
  private static async invalidateCategoriesCache(): Promise<void> {
    await CacheService.deleteByPattern(`${CACHE_KEYS.CATEGORIES}*`);
  }

  /**
   * Map Category model to CategoryDTO
   * @param category Category model
   * @returns CategoryDTO
   */
  private static mapToDTO(category: Category): CategoryDTO {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    };
  }
}