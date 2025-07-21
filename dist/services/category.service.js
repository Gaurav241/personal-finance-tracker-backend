"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const category_repository_1 = require("../repositories/category.repository");
const cache_service_1 = __importStar(require("./cache.service"));
/**
 * Service for category-related operations
 */
class CategoryService {
    /**
     * Get all categories with caching
     * @returns Promise resolving to array of categories
     */
    static async getAllCategories() {
        // Try to get from cache first
        const cacheKey = cache_service_1.default.getCategoriesKey();
        const cachedCategories = await cache_service_1.default.get(cacheKey);
        if (cachedCategories) {
            return cachedCategories;
        }
        // If not in cache, get from database
        const categories = await category_repository_1.CategoryRepository.findAll();
        const categoryDTOs = categories.map(this.mapToDTO);
        // Store in cache
        await cache_service_1.default.set(cacheKey, categoryDTOs, cache_service_1.CACHE_TTL.CATEGORIES);
        return categoryDTOs;
    }
    /**
     * Get categories by type with caching
     * @param type Category type (income or expense)
     * @returns Promise resolving to array of categories
     */
    static async getCategoriesByType(type) {
        // Try to get from cache first
        const cacheKey = `${cache_service_1.default.getCategoriesKey()}:${type}`;
        const cachedCategories = await cache_service_1.default.get(cacheKey);
        if (cachedCategories) {
            return cachedCategories;
        }
        // If not in cache, get from database
        const categories = await category_repository_1.CategoryRepository.findByType(type);
        const categoryDTOs = categories.map(this.mapToDTO);
        // Store in cache
        await cache_service_1.default.set(cacheKey, categoryDTOs, cache_service_1.CACHE_TTL.CATEGORIES);
        return categoryDTOs;
    }
    /**
     * Get category by ID
     * @param id Category ID
     * @returns Promise resolving to category or null if not found
     */
    static async getCategoryById(id) {
        const category = await category_repository_1.CategoryRepository.findById(id);
        return category ? this.mapToDTO(category) : null;
    }
    /**
     * Create a new category (admin only)
     * @param data Category data
     * @returns Promise resolving to created category
     */
    static async createCategory(data) {
        const category = await category_repository_1.CategoryRepository.create(data);
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
    static async updateCategory(id, data) {
        const category = await category_repository_1.CategoryRepository.update(id, data);
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
    static async deleteCategory(id) {
        const result = await category_repository_1.CategoryRepository.delete(id);
        if (result) {
            // Invalidate categories cache
            await this.invalidateCategoriesCache();
        }
        return result;
    }
    /**
     * Invalidate all category-related caches
     */
    static async invalidateCategoriesCache() {
        await cache_service_1.default.deleteByPattern(`${cache_service_1.CACHE_KEYS.CATEGORIES}*`);
    }
    /**
     * Map Category model to CategoryDTO
     * @param category Category model
     * @returns CategoryDTO
     */
    static mapToDTO(category) {
        return {
            id: category.id,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon
        };
    }
}
exports.CategoryService = CategoryService;
