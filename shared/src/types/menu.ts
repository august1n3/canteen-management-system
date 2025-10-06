export enum MenuItemCategory {
  MAIN_COURSE = 'main_course',
  APPETIZER = 'appetizer',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage',
  SNACK = 'snack',
  SIDE_DISH = 'side_dish'
}

export enum MenuItemStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  COMING_SOON = 'coming_soon'
}

export enum DietaryRestriction {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
  NUT_FREE = 'nut_free',
  HALAL = 'halal',
  KOSHER = 'kosher'
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  status: MenuItemStatus;
  imageUrl?: string;
  preparationTime: number; // in minutes
  ingredients: string[];
  allergens: string[];
  dietaryRestrictions: DietaryRestriction[];
  nutritionalInfo?: NutritionalInfo;
  stockQuantity?: number;
  isSpicy?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  imageUrl?: string;
  preparationTime: number;
  ingredients: string[];
  allergens: string[];
  dietaryRestrictions: DietaryRestriction[];
  nutritionalInfo?: NutritionalInfo;
  stockQuantity?: number;
  isSpicy?: boolean;
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {
  status?: MenuItemStatus;
  isPopular?: boolean;
  isNew?: boolean;
}

export interface MenuFilter {
  category?: MenuItemCategory;
  status?: MenuItemStatus;
  dietaryRestrictions?: DietaryRestriction[];
  maxPrice?: number;
  minPrice?: number;
  isSpicy?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  available?: boolean;
}

export interface MenuStats {
  totalItems: number;
  availableItems: number;
  outOfStockItems: number;
  popularItems: number;
  newItems: number;
  averagePrice: number;
  categoriesCount: Record<MenuItemCategory, number>;
}