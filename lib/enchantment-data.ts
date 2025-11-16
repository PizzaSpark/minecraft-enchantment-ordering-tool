// Enchantment data from the original tool
export interface EnchantmentData {
  levelMax: string;
  weight: string;
  incompatible: string[];
  items: string[];
}

export interface EnchantmentsDatabase {
  [key: string]: EnchantmentData;
}

export const ENCHANTMENTS: EnchantmentsDatabase = {
  protection: {
    levelMax: "4",
    weight: "1",
    incompatible: ["blast_protection", "fire_protection", "projectile_protection"],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"]
  },
  aqua_affinity: {
    levelMax: "1",
    weight: "2",
    incompatible: [],
    items: ["helmet", "turtle_shell"]
  },
  bane_of_arthropods: {
    levelMax: "5",
    weight: "1",
    incompatible: ["smite", "sharpness", "density", "breach"],
    items: ["sword", "axe", "mace"]
  },
  blast_protection: {
    levelMax: "4",
    weight: "2",
    incompatible: ["fire_protection", "protection", "projectile_protection"],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"]
  },
  channeling: {
    levelMax: "1",
    weight: "4",
    incompatible: ["riptide"],
    items: ["trident"]
  },
  depth_strider: {
    levelMax: "3",
    weight: "2",
    incompatible: ["frost_walker"],
    items: ["boots"]
  },
  efficiency: {
    levelMax: "5",
    weight: "1",
    incompatible: [],
    items: ["pickaxe", "shovel", "axe", "hoe"]
  },
  feather_falling: {
    levelMax: "4",
    weight: "1",
    incompatible: [],
    items: ["boots"]
  },
  fire_aspect: {
    levelMax: "2",
    weight: "2",
    incompatible: [],
    items: ["sword"]
  },
  fire_protection: {
    levelMax: "4",
    weight: "1",
    incompatible: ["blast_protection", "protection", "projectile_protection"],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"]
  },
  flame: {
    levelMax: "1",
    weight: "2",
    incompatible: [],
    items: ["bow"]
  },
  fortune: {
    levelMax: "3",
    weight: "2",
    incompatible: ["silk_touch"],
    items: ["pickaxe", "shovel", "axe", "hoe"]
  },
  frost_walker: {
    levelMax: "2",
    weight: "2",
    incompatible: ["depth_strider"],
    items: ["boots"]
  },
  impaling: {
    levelMax: "5",
    weight: "2",
    incompatible: [],
    items: ["trident"]
  },
  infinity: {
    levelMax: "1",
    weight: "4",
    incompatible: ["mending"],
    items: ["bow"]
  },
  knockback: {
    levelMax: "2",
    weight: "1",
    incompatible: [],
    items: ["sword"]
  },
  looting: {
    levelMax: "3",
    weight: "2",
    incompatible: [],
    items: ["sword"]
  },
  loyalty: {
    levelMax: "3",
    weight: "1",
    incompatible: ["riptide"],
    items: ["trident"]
  },
  luck_of_the_sea: {
    levelMax: "3",
    weight: "2",
    incompatible: [],
    items: ["fishing_rod"]
  },
  lure: {
    levelMax: "3",
    weight: "2",
    incompatible: [],
    items: ["fishing_rod"]
  },
  multishot: {
    levelMax: "1",
    weight: "2",
    incompatible: ["piercing"],
    items: ["crossbow"]
  },
  piercing: {
    levelMax: "4",
    weight: "1",
    incompatible: ["multishot"],
    items: ["crossbow"]
  },
  power: {
    levelMax: "5",
    weight: "1",
    incompatible: [],
    items: ["bow"]
  },
  projectile_protection: {
    levelMax: "4",
    weight: "1",
    incompatible: ["blast_protection", "fire_protection", "protection"],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"]
  },
  punch: {
    levelMax: "2",
    weight: "2",
    incompatible: [],
    items: ["bow"]
  },
  quick_charge: {
    levelMax: "3",
    weight: "1",
    incompatible: [],
    items: ["crossbow"]
  },
  respiration: {
    levelMax: "3",
    weight: "2",
    incompatible: [],
    items: ["helmet", "turtle_shell"]
  },
  riptide: {
    levelMax: "3",
    weight: "2",
    incompatible: ["channeling", "loyalty"],
    items: ["trident"]
  },
  sharpness: {
    levelMax: "5",
    weight: "1",
    incompatible: ["bane_of_arthropods", "smite"],
    items: ["sword", "axe"]
  },
  silk_touch: {
    levelMax: "1",
    weight: "4",
    incompatible: ["fortune"],
    items: ["pickaxe", "shovel", "axe", "hoe"]
  },
  smite: {
    levelMax: "5",
    weight: "1",
    incompatible: ["bane_of_arthropods", "sharpness", "density", "breach"],
    items: ["sword", "axe", "mace"]
  },
  sweeping_edge: {
    levelMax: "3",
    weight: "2",
    incompatible: [],
    items: ["sword"]
  },
  thorns: {
    levelMax: "3",
    weight: "4",
    incompatible: [],
    items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"]
  },
  unbreaking: {
    levelMax: "3",
    weight: "1",
    incompatible: [],
    items: ["helmet", "chestplate", "leggings", "boots", "pickaxe", "shovel", "axe", "sword", "hoe", "brush", "fishing_rod",
      "bow", "shears", "flint_and_steel", "carrot_on_a_stick", "warped_fungus_on_a_stick", "shield", "elytra", "trident",
      "turtle_shell", "crossbow", "mace"
    ]
  },
  mending: {
    levelMax: "1",
    weight: "2",
    incompatible: ["infinity"],
    items: ["helmet", "chestplate", "leggings", "boots", "pickaxe", "shovel", "axe", "sword", "hoe", "brush", "fishing_rod",
      "bow", "shears", "flint_and_steel", "carrot_on_a_stick", "warped_fungus_on_a_stick", "shield", "elytra", "trident",
      "turtle_shell", "crossbow", "mace"
    ]
  },
  binding_curse: {
    levelMax: "1",
    weight: "4",
    incompatible: [],
    items: ["helmet", "chestplate", "leggings", "boots", "elytra", "pumpkin", "turtle_shell"]
  },
  vanishing_curse: {
    levelMax: "1",
    weight: "4",
    incompatible: [],
    items: ["helmet", "chestplate", "leggings", "boots", "pickaxe", "shovel", "axe", "sword", "hoe", "brush", "fishing_rod",
      "bow", "shears", "flint_and_steel", "carrot_on_a_stick", "warped_fungus_on_a_stick", "shield", "elytra", "trident",
      "turtle_shell", "crossbow", "pumpkin", "mace"
    ]
  },
  soul_speed: {
    levelMax: "3",
    weight: "4",
    incompatible: ["frost_walker", "depth_strider"],
    items: ["boots"]
  },
  swift_sneak: {
    levelMax: "3",
    weight: "4",
    incompatible: [],
    items: ["leggings"]
  },
  wind_burst: {
    levelMax: "3",
    weight: "2",
    incompatible: [],
    items: ["mace"]
  },
  density: {
    levelMax: "5",
    weight: "1",
    incompatible: ["breach", "smite", "bane_of_arthropods"],
    items: ["mace"]
  },
  breach: {
    levelMax: "4",
    weight: "2",
    incompatible: ["density", "smite", "bane_of_arthropods"],
    items: ["mace"]
  }
};

export const ITEMS = [
  "helmet", "chestplate", "leggings", "boots", "turtle_shell",
  "sword", "axe", "pickaxe", "shovel", "hoe", "trident", "mace",
  "bow", "crossbow", "fishing_rod", "shield", "elytra", "book"
];

export const ITEM_DISPLAY_NAMES: { [key: string]: string } = {
  helmet: "Helmet",
  chestplate: "Chestplate",
  leggings: "Leggings",
  boots: "Boots",
  turtle_shell: "Turtle Shell",
  sword: "Sword",
  axe: "Axe",
  pickaxe: "Pickaxe",
  shovel: "Shovel",
  hoe: "Hoe",
  trident: "Trident",
  mace: "Mace",
  bow: "Bow",
  crossbow: "Crossbow",
  fishing_rod: "Fishing Rod",
  shield: "Shield",
  elytra: "Elytra",
  book: "Book"
};

export const ENCHANTMENT_DISPLAY_NAMES: { [key: string]: string } = {
  protection: "Protection",
  aqua_affinity: "Aqua Affinity",
  bane_of_arthropods: "Bane of Arthropods",
  blast_protection: "Blast Protection",
  channeling: "Channeling",
  depth_strider: "Depth Strider",
  efficiency: "Efficiency",
  feather_falling: "Feather Falling",
  fire_aspect: "Fire Aspect",
  fire_protection: "Fire Protection",
  flame: "Flame",
  fortune: "Fortune",
  frost_walker: "Frost Walker",
  impaling: "Impaling",
  infinity: "Infinity",
  knockback: "Knockback",
  looting: "Looting",
  loyalty: "Loyalty",
  luck_of_the_sea: "Luck of the Sea",
  lure: "Lure",
  multishot: "Multishot",
  piercing: "Piercing",
  power: "Power",
  projectile_protection: "Projectile Protection",
  punch: "Punch",
  quick_charge: "Quick Charge",
  respiration: "Respiration",
  riptide: "Riptide",
  sharpness: "Sharpness",
  silk_touch: "Silk Touch",
  smite: "Smite",
  sweeping_edge: "Sweeping Edge",
  thorns: "Thorns",
  unbreaking: "Unbreaking",
  mending: "Mending",
  binding_curse: "Curse of Binding",
  vanishing_curse: "Curse of Vanishing",
  soul_speed: "Soul Speed",
  swift_sneak: "Swift Sneak",
  wind_burst: "Wind Burst",
  density: "Density",
  breach: "Breach"
};
