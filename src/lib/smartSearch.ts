import { ProductItem } from './data';

// ==========================================
// 1. Lightweight Culinary Synonym Dictionary
// ==========================================
const SYNONYM_MAP: Record<string, string[]> = {
  // Pizza synonyms & related specialties
  pizza: ['pizza', 'pizzas', 'crust', 'slice', 'margherita', 'pepperoni', 'veg-pizzas', 'non-veg-pizzas', 'pan-pizzas'],
  pizzas: ['pizza', 'pizzas', 'crust', 'slice', 'margherita', 'pepperoni', 'veg-pizzas', 'non-veg-pizzas', 'pan-pizzas'],
  piza: ['pizza', 'pizzas'],
  pie: ['pizza', 'pan-pizzas'],

  // Protein / Meat synonyms
  chicken: ['chicken', 'chick', 'tikka', 'wings', 'nuggets', 'pops', 'salami', 'non-veg', 'nonveg', 'non-veg-pizzas'],
  chiken: ['chicken', 'tikka', 'wings', 'nuggets', 'pops'],
  nonveg: ['chicken', 'salami', 'tikka', 'non-veg', 'non-veg-pizzas'],
  meat: ['chicken', 'salami', 'pepperoni', 'non-veg-pizzas'],

  // Vegetarian / Cheese
  veg: ['veg', 'veggie', 'vegetable', 'paneer', 'corn', 'mushroom', 'capsicum', 'veg-pizzas'],
  veggie: ['veg', 'veggie', 'vegetable', 'deluxe veggie', 'veg loaded'],
  paneer: ['paneer', 'cottage cheese', 'peppy paneer', 'tandoori paneer'],
  cheese: ['cheese', 'cheesy', 'mozzarella', 'burst', 'cheddar'],
  cheesy: ['cheese', 'cheesy', 'mozzarella', 'burst'],

  // Beverages & Drinks
  drink: ['drink', 'drinks', 'beverage', 'beverages', 'coffee', 'shake', 'cooler', 'soda', 'mojito', 'tea', 'boba', 'desserts-beverages'],
  drinks: ['drink', 'drinks', 'beverage', 'beverages', 'coffee', 'shake', 'cooler', 'soda', 'mojito', 'tea', 'boba'],
  beverage: ['drink', 'drinks', 'beverage', 'beverages', 'coffee', 'shake', 'cooler', 'soda', 'mojito', 'tea', 'boba'],
  beverages: ['drink', 'drinks', 'beverage', 'beverages', 'coffee', 'shake', 'cooler', 'soda', 'mojito', 'tea', 'boba'],
  cold: ['cold coffee', 'iced', 'chilled', 'cooler', 'frappe'],
  coffee: ['coffee', 'cold coffee', 'espresso', 'frappe', 'hazelnut', 'irish', 'caramel'],
  shake: ['shake', 'milkshake', 'thickshake', 'oreo', 'chocolate', 'mango', 'strawberry'],
  soda: ['soda', 'fresh lime soda', 'lime', 'lemonade', 'cooler'],
  mojito: ['mojito', 'virgin mojito', 'mint', 'cooler'],
  tea: ['tea', 'ice tea', 'iced tea', 'peach tea', 'lemon tea'],
  boba: ['boba', 'popping boba', 'pearls', 'bubble tea'],

  // Desserts & Sweets
  sweet: ['sweet', 'dessert', 'desserts', 'cake', 'lava', 'choco', 'chocolate', 'shake', 'desserts-beverages'],
  dessert: ['dessert', 'desserts', 'cake', 'lava', 'choco', 'chocolate', 'shake', 'frappe'],
  desserts: ['dessert', 'desserts', 'cake', 'lava', 'choco', 'chocolate', 'shake', 'frappe'],
  cake: ['cake', 'choco lava', 'lava cake', 'dessert'],
  lava: ['lava', 'choco lava', 'cake', 'chocolate'],
  choco: ['choco', 'chocolate', 'lava', 'frappe', 'oreo'],
  chocolate: ['chocolate', 'choco', 'lava', 'frappe', 'oreo', 'belgian'],

  // Sides & Starters
  bread: ['garlic bread', 'stuffed garlic bread', 'bread', 'loaf', 'starters-sides'],
  garlic: ['garlic bread', 'garlic', 'herb garlic'],
  fries: ['fries', 'french fries', 'peri peri fries', 'potato'],
  sides: ['starters', 'sides', 'garlic bread', 'fries', 'taco', 'pockets', 'bites', 'starters-sides'],
  starters: ['starters', 'sides', 'garlic bread', 'fries', 'taco', 'pockets', 'bites', 'starters-sides'],
  snack: ['snack', 'sides', 'fries', 'taco', 'parcel', 'bites', 'nuggets'],
  taco: ['taco', 'tacos', 'tortilla'],
  parcel: ['parcel', 'zingy parcel', 'snack'],

  // Burgers & Wraps
  burger: ['burger', 'burgers', 'patty', 'burgers-wraps'],
  burgers: ['burger', 'burgers', 'patty', 'burgers-wraps'],
  wrap: ['wrap', 'wraps', 'roll', 'tortilla', 'burgers-wraps'],
  wraps: ['wrap', 'wraps', 'roll', 'tortilla', 'burgers-wraps'],

  // Flavor profiles
  spicy: ['spicy', 'schezwan', 'peri-peri', 'peri peri', 'hot', 'chili', 'chilli', 'jalapeno', 'paprika'],
  hot: ['spicy', 'hot', 'wings', 'hot hippy', 'chili', 'schezwan'],
  tandoori: ['tandoori', 'tikka', 'smoky', 'clay oven'],
  barbeque: ['barbeque', 'bbq', 'smoky'],
  bbq: ['barbeque', 'bbq', 'smoky'],
  makhani: ['makhani', 'butter', 'creamy'],
};

// ==========================================
// 2. Levenshtein Distance for Typo Tolerance
// ==========================================
function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if token matches target word fuzzy-wise (allowing 1 typo for 4-5 chars, 2 for 6+ chars)
 */
function fuzzyTokenMatch(token: string, word: string): boolean {
  if (token === word) return true;
  if (word.includes(token)) return true;
  if (token.length >= 3 && word.startsWith(token)) return true;

  // For very short words (< 4 chars), require exact prefix/inclusion
  if (token.length < 4) {
    return word.includes(token);
  }

  const maxDistance = token.length >= 6 ? 2 : 1;
  const distance = getLevenshteinDistance(token, word);
  return distance <= maxDistance;
}

// ==========================================
// 3. Tokenizer & Multi-word Matcher
// ==========================================
export interface SmartSearchResult<T> {
  item: T;
  score: number;
}

export interface SmartSearchOptions {
  threshold?: number;
  categoryFilter?: string;
  vegFilter?: boolean | null;
}

/**
 * Tokenizes user query into normalized search words
 */
export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Generates expanded tokens including synonyms
 */
function getExpandedTokens(tokens: string[]): Set<string> {
  const expanded = new Set<string>();

  for (const token of tokens) {
    expanded.add(token);

    // Look for exact synonym matches
    if (SYNONYM_MAP[token]) {
      for (const syn of SYNONYM_MAP[token]) {
        expanded.add(syn);
      }
    }

    // Look for fuzzy synonym keys (e.g. user typed "piza" -> matches "pizza" synonyms)
    for (const [key, synList] of Object.entries(SYNONYM_MAP)) {
      if (fuzzyTokenMatch(token, key)) {
        expanded.add(key);
        for (const syn of synList) {
          expanded.add(syn);
        }
      }
    }
  }

  return expanded;
}

/**
 * Matches a product against a search query using Tokenization,
 * Synonym Mapping, Multi-field inspection, and Typo Fuzzy matching.
 */
export function scoreProductSearch(product: ProductItem, tokens: string[]): number {
  if (tokens.length === 0) return 1;

  const name = product.name.toLowerCase();
  const description = (product.description || '').toLowerCase();
  const categorySlug = (product.categorySlug || '').toLowerCase();
  const categoryName = categorySlug.replace(/-/g, ' ');
  const badge = (product.badge || '').toLowerCase();

  // Combine product text fields into searchable words list
  const productWords = [
    ...tokenizeQuery(name),
    ...tokenizeQuery(categoryName),
    ...tokenizeQuery(badge),
    ...tokenizeQuery(description).slice(0, 15), // prioritize top descriptive words
  ];

  const fullText = `${name} ${categoryName} ${badge} ${description}`;

  // Complete multi-word match bonus (e.g. user typed "peppy paneer" exactly)
  const rawQuery = tokens.join(' ');
  if (name.includes(rawQuery)) {
    return 100;
  }
  if (description.includes(rawQuery)) {
    return 80;
  }

  let matchedTokensCount = 0;
  let totalScore = 0;

  for (const token of tokens) {
    // 1. Direct match in name
    if (name.includes(token)) {
      matchedTokensCount++;
      totalScore += 40;
      continue;
    }

    // 2. Direct match in category (e.g. token "pizza" matches category "veg-pizzas")
    if (categoryName.includes(token) || categorySlug.includes(token)) {
      matchedTokensCount++;
      totalScore += 30;
      continue;
    }

    // 3. Match in badge or description
    if (badge.includes(token)) {
      matchedTokensCount++;
      totalScore += 25;
      continue;
    }

    if (description.includes(token)) {
      matchedTokensCount++;
      totalScore += 15;
      continue;
    }

    // 4. Synonym expansion match
    const synList = SYNONYM_MAP[token] || [];
    let synonymMatched = false;

    for (const syn of synList) {
      if (name.includes(syn)) {
        matchedTokensCount++;
        totalScore += 25;
        synonymMatched = true;
        break;
      }
      if (categoryName.includes(syn) || categorySlug.includes(syn)) {
        matchedTokensCount++;
        totalScore += 20;
        synonymMatched = true;
        break;
      }
      if (description.includes(syn)) {
        matchedTokensCount++;
        totalScore += 10;
        synonymMatched = true;
        break;
      }
    }

    if (synonymMatched) continue;

    // 5. Fuzzy typo match across product words
    let fuzzyMatched = false;
    for (const pWord of productWords) {
      if (fuzzyTokenMatch(token, pWord)) {
        matchedTokensCount++;
        totalScore += 15;
        fuzzyMatched = true;
        break;
      }
    }

    if (fuzzyMatched) continue;

    // 6. Fuzzy match against synonym keys (e.g. token "chiken" matches key "chicken")
    for (const [key, relatedWords] of Object.entries(SYNONYM_MAP)) {
      if (fuzzyTokenMatch(token, key)) {
        for (const rel of relatedWords) {
          if (name.includes(rel) || categoryName.includes(rel)) {
            matchedTokensCount++;
            totalScore += 12;
            fuzzyMatched = true;
            break;
          }
        }
      }
      if (fuzzyMatched) break;
    }
  }

  // If none of the tokens matched, score is 0
  if (matchedTokensCount === 0) return 0;

  // Reward products that match MORE or ALL tokens in the query
  // (e.g. "chicken pizza" requires both "chicken" and "pizza" tokens to score much higher)
  const tokenCoverageRatio = matchedTokensCount / tokens.length;
  
  // Require at least 50% token coverage for multi-word queries
  if (tokens.length > 1 && tokenCoverageRatio < 0.5) {
    return 0;
  }

  return totalScore * tokenCoverageRatio;
}

// ==========================================
// 4. Main Smart Search Function
// ==========================================
/**
 * Smart Search: filters and ranks products by query with tokenization,
 * synonym expansion, and fuzzy typo tolerance.
 */
export function smartSearchProducts(
  products: ProductItem[],
  query: string,
  options?: SmartSearchOptions
): ProductItem[] {
  const cleanQuery = (query || '').trim();

  // If search query is empty, apply standard category and veg filters
  if (!cleanQuery) {
    return products.filter((p) => {
      if (options?.categoryFilter && options.categoryFilter !== 'all' && p.categorySlug !== options.categoryFilter) {
        return false;
      }
      if (options?.vegFilter !== undefined && options?.vegFilter !== null && p.isVeg !== options.vegFilter) {
        return false;
      }
      return true;
    });
  }

  const tokens = tokenizeQuery(cleanQuery);
  if (tokens.length === 0) return products;

  // Score each product
  const scoredItems: SmartSearchResult<ProductItem>[] = [];

  for (const product of products) {
    // Apply Veg / Non-Veg filter if specified
    if (options?.vegFilter !== undefined && options?.vegFilter !== null && product.isVeg !== options.vegFilter) {
      continue;
    }

    // When searching, allow category override unless explicitly constrained
    // (e.g., if user is in "all", search across entire catalog; if in a specific category, allow matching or boost)
    const score = scoreProductSearch(product, tokens);

    if (score > 0) {
      let finalScore = score;

      // Bonus if it also matches the active category
      if (options?.categoryFilter && options.categoryFilter !== 'all') {
        if (product.categorySlug === options.categoryFilter) {
          finalScore += 10;
        }
      }

      scoredItems.push({ item: product, score: finalScore });
    }
  }

  // Sort by highest relevance score descending
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.map((si) => si.item);
}

export default smartSearchProducts;
