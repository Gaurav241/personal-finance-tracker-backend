/**
 * Category model interface
 */
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  createdAt: Date;
}

/**
 * Category Data Transfer Object
 */
export interface CategoryDTO {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string;
}

/**
 * Data required to create a new category
 */
export interface CreateCategoryDTO {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

/**
 * Data required to update an existing category
 */
export interface UpdateCategoryDTO {
  name?: string;
  color?: string;
  icon?: string;
}