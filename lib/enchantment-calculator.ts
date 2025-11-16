// Core calculation logic from work.js

import { ENCHANTMENTS } from './enchantment-data';

const MAXIMUM_MERGE_LEVELS = 39;

export interface ItemObject {
  i: string | number; // item namespace or enchant id
  e: number[]; // enchant ids
  c: any; // combination/instructions
  w: number; // work penalty
  l: number; // value/cost
  x: number; // total xp
}

export interface Instruction {
  left: any;
  right: any;
  levels: number;
  xp: number;
  priorWork: number;
}

let ID_LIST: { [key: string]: number } = {};
let ENCHANTMENT2WEIGHT: number[] = [];

// Initialize enchantment IDs and weights
function initializeEnchantmentData() {
  let id = 0;
  for (const enchant in ENCHANTMENTS) {
    const enchantData = ENCHANTMENTS[enchant];
    const weight = parseInt(enchantData.weight);
    ID_LIST[enchant] = id;
    ENCHANTMENT2WEIGHT[id] = weight;
    id++;
  }
}

initializeEnchantmentData();

// Calculate XP from level
function experience(level: number): number {
  if (level === 0) {
    return 0;
  } else if (level <= 16) {
    return level ** 2 + 6 * level;
  } else if (level <= 31) {
    return 2.5 * level ** 2 - 40.5 * level + 360;
  } else {
    return 4.5 * level ** 2 - 162.5 * level + 2220;
  }
}

class ItemObj implements ItemObject {
  i: string | number;
  e: number[];
  c: any;
  w: number;
  l: number;
  x: number;

  constructor(name: string | number, value = 0, id: number[] = []) {
    this.i = name;
    this.e = id;
    this.c = {};
    this.w = 0;
    this.l = value;
    this.x = 0;
  }
}

class MergeLevelsTooExpensiveError extends Error {
  constructor(message = 'merge levels is above maximum allowed') {
    super(message);
    this.name = 'MergeLevelsTooExpensiveError';
  }
}

class MergeEnchants extends ItemObj {
  constructor(left: ItemObject, right: ItemObject) {
    const mergeCost = right.l + 2 ** left.w - 1 + 2 ** right.w - 1;
    if (mergeCost > MAXIMUM_MERGE_LEVELS) {
      throw new MergeLevelsTooExpensiveError();
    }
    const newValue = left.l + right.l;
    super(left.i, newValue);
    this.e = left.e.concat(right.e);
    this.w = Math.max(left.w, right.w) + 1;
    this.x = left.x + right.x + experience(mergeCost);
    this.c = { L: left.c, R: right.c, l: mergeCost, w: this.w, v: this.l };
  }
}

function combinations<T>(set: T[], k: number): T[][] {
  if (k > set.length || k <= 0) {
    return [];
  }
  if (k === set.length) {
    return [set];
  }
  if (k === 1) {
    return set.reduce((acc: T[][], cur) => [...acc, [cur]], []);
  }
  const combs: T[][] = [];
  let tailCombs: T[][] = [];
  for (let i = 0; i <= set.length - k; i++) {
    tailCombs = combinations(set.slice(i + 1), k - 1);
    for (let j = 0; j < tailCombs.length; j++) {
      combs.push([set[i], ...tailCombs[j]]);
    }
  }
  return combs;
}

function compareCheapest(item1: ItemObject, item2: ItemObject): { [key: number]: ItemObject } {
  const work2item: { [key: number]: ItemObject } = {};
  const work1 = item1.w;
  const work2 = item2.w;

  if (work1 === work2) {
    const value1 = item1.l;
    const value2 = item2.l;
    if (value1 === value2) {
      const minXpCost1 = item1.x;
      const minXpCost2 = item2.x;
      if (minXpCost1 <= minXpCost2) {
        work2item[work1] = item1;
      } else {
        work2item[work2] = item2;
      }
    } else if (value1 < value2) {
      work2item[work1] = item1;
    } else {
      work2item[work2] = item2;
    }
  } else {
    work2item[work1] = item1;
    work2item[work2] = item2;
  }

  return work2item;
}

function cheapestItemFromItems2(leftItem: ItemObject, rightItem: ItemObject): ItemObject {
  if (rightItem.i === 'item') {
    return new MergeEnchants(rightItem, leftItem);
  } else if (leftItem.i === 'item') {
    return new MergeEnchants(leftItem, rightItem);
  }

  let normalItemObj: ItemObject;
  try {
    normalItemObj = new MergeEnchants(leftItem, rightItem);
  } catch {
    return new MergeEnchants(rightItem, leftItem);
  }

  let reversedItemObj: ItemObject;
  try {
    reversedItemObj = new MergeEnchants(rightItem, leftItem);
  } catch {
    return normalItemObj;
  }

  const cheapestWork2item = compareCheapest(normalItemObj, reversedItemObj);
  const priorWorks = Object.keys(cheapestWork2item);
  const priorWork = parseInt(priorWorks[0]);
  return cheapestWork2item[priorWork];
}

function removeExpensiveCandidatesFromDictionary(work2item: { [key: number]: ItemObject }): { [key: number]: ItemObject } {
  const cheapestWork2item: { [key: number]: ItemObject } = {};
  let cheapestValue: number | undefined;

  for (const workStr in work2item) {
    const work = parseInt(workStr);
    const item = work2item[work];
    const value = item.l;

    if (!(value >= (cheapestValue || Infinity))) {
      cheapestWork2item[work] = item;
      cheapestValue = value;
    }
  }
  return cheapestWork2item;
}

const memoizeCache: { [key: string]: any } = {};

function hashFromItem(itemObj: ItemObject): string {
  const enchants = itemObj.e;
  const sortedIds = [...enchants].sort();
  const itemNamespace = itemObj.i;
  const work = itemObj.w;
  return JSON.stringify([itemNamespace, sortedIds, work]);
}

function memoizeHashFromArguments(items: ItemObject[]): string {
  const hashes = items.map(item => hashFromItem(item));
  return JSON.stringify(hashes);
}

const cheapestItemsFromList = (items: ItemObject[]): { [key: number]: ItemObject } => {
  const argsKey = memoizeHashFromArguments(items);
  if (!memoizeCache[argsKey]) {
    memoizeCache[argsKey] = cheapestItemsFromListImpl(items);
  }
  return memoizeCache[argsKey];
};

function cheapestItemsFromListImpl(items: ItemObject[]): { [key: number]: ItemObject } {
  let work2item: { [key: number]: ItemObject } = {};
  const itemCount = items.length;

  switch (itemCount) {
    case 1: {
      const item = items[0];
      const work = item.w;
      work2item[work] = item;
      return work2item;
    }
    case 2: {
      const leftItem = items[0];
      const rightItem = items[1];
      const cheapestItem = cheapestItemFromItems2(leftItem, rightItem);
      const cheapestWork = cheapestItem.w;
      work2item[cheapestWork] = cheapestItem;
      return work2item;
    }
    default: {
      return cheapestItemsFromListN(items, Math.floor(itemCount / 2));
    }
  }
}

function cheapestItemsFromListN(items: ItemObject[], maxSubcount: number): { [key: number]: ItemObject } {
  const cheapestWork2item: { [key: number]: ItemObject } = {};
  const cheapestPriorWorks: number[] = [];

  for (let subcount = 1; subcount <= maxSubcount; subcount++) {
    combinations(items, subcount).forEach(leftItem => {
      const rightItem = items.filter(itemObj => !leftItem.includes(itemObj));

      const leftWork2item = cheapestItemsFromList(leftItem);
      const rightWork2item = cheapestItemsFromList(rightItem);
      const newWork2item = cheapestItemsFromDictionaries([leftWork2item, rightWork2item]);

      for (const workStr in newWork2item) {
        const work = parseInt(workStr);
        const newItem = newWork2item[work];
        const priorWorkExists = cheapestPriorWorks.includes(work);

        if (priorWorkExists) {
          const cheapestItem = cheapestWork2item[work];
          const newCheapestWork2item = compareCheapest(cheapestItem, newItem);
          cheapestWork2item[work] = newCheapestWork2item[work];
        } else {
          cheapestWork2item[work] = newItem;
          cheapestPriorWorks.push(work);
        }
      }
    });
  }
  return cheapestWork2item;
}

function cheapestItemsFromDictionaries(work2items: { [key: number]: ItemObject }[]): { [key: number]: ItemObject } {
  const work2itemCount = work2items.length;
  switch (work2itemCount) {
    case 1:
      return work2items[0];
    case 2:
      const leftWork2item = work2items[0];
      const rightWork2item = work2items[1];
      return cheapestItemsFromDictionaries2(leftWork2item, rightWork2item);
    default:
      return {};
  }
}

function cheapestItemsFromDictionaries2(
  leftWork2item: { [key: number]: ItemObject },
  rightWork2item: { [key: number]: ItemObject }
): { [key: number]: ItemObject } {
  let cheapestWork2item: { [key: number]: ItemObject } = {};
  const cheapestPriorWorks: number[] = [];

  for (const leftWorkStr in leftWork2item) {
    const leftItem = leftWork2item[parseInt(leftWorkStr)];

    for (const rightWorkStr in rightWork2item) {
      const rightItem = rightWork2item[parseInt(rightWorkStr)];

      let newWork2item: { [key: number]: ItemObject } = {};
      try {
        newWork2item = cheapestItemsFromList([leftItem, rightItem]);
      } catch (error) {
        const mergeLevelsTooExpensive = error instanceof MergeLevelsTooExpensiveError;
        if (!mergeLevelsTooExpensive) {
          throw error;
        }
      }

      for (const workStr in newWork2item) {
        const work = parseInt(workStr);
        const newItem = newWork2item[work];
        const priorWorkExists = cheapestPriorWorks.includes(work);

        if (priorWorkExists) {
          const cheapestItem = cheapestWork2item[work];
          const newCheapestWork2item = compareCheapest(cheapestItem, newItem);
          if (newCheapestWork2item[work]) {
            cheapestWork2item[work] = newCheapestWork2item[work];
          } else {
            cheapestWork2item[work] = newItem;
            cheapestPriorWorks.push(work);
          }
        } else {
          cheapestWork2item[work] = newItem;
          cheapestPriorWorks.push(work);
        }
      }
    }
  }
  cheapestWork2item = removeExpensiveCandidatesFromDictionary(cheapestWork2item);
  return cheapestWork2item;
}

function getInstructions(comb: any): Instruction[] {
  const instructions: Instruction[] = [];
  let childInstructions: Instruction[];

  for (const key in comb) {
    if (key === 'L' || key === 'R') {
      if (typeof comb[key].I === 'undefined') {
        childInstructions = getInstructions(comb[key]);
        childInstructions.forEach(singleInstruction => {
          instructions.push(singleInstruction);
        });
      }
      let id: number;
      if (Number.isInteger(comb[key].I)) {
        id = comb[key].I;
        comb[key].I = Object.keys(ID_LIST).find(k => ID_LIST[k] === id);
      } else if (typeof comb[key].I === 'string' && !Object.keys(ID_LIST).includes(comb[key].I)) {
        comb[key].I = 'item';
      }
    }
  }

  let mergeCost: number;
  if (Number.isInteger(comb.R.v)) {
    mergeCost = comb.R.v + 2 ** comb.L.w - 1 + 2 ** comb.R.w - 1;
  } else {
    mergeCost = comb.R.l + 2 ** comb.L.w - 1 + 2 ** comb.R.w - 1;
  }

  const work = Math.max(comb.L.w, comb.R.w) + 1;
  const singleInstruction: Instruction = {
    left: comb.L,
    right: comb.R,
    levels: mergeCost,
    xp: experience(mergeCost),
    priorWork: 2 ** work - 1
  };
  instructions.push(singleInstruction);
  return instructions;
}

export interface CalculationResult {
  success: boolean;
  instructions: Instruction[];
  totalLevels: number;
  totalXp: number;
  minXp: number;
  item: ItemObject;
  timeMs: number;
}

export function calculateOptimalEnchantmentOrder(
  itemName: string,
  enchants: [string, number][],
  mode: 'levels' | 'prior_work' = 'levels'
): CalculationResult {
  const startTime = performance.now();

  // Clear memoization cache for new calculation
  Object.keys(memoizeCache).forEach(key => delete memoizeCache[key]);

  const enchantObjs: ItemObject[] = [];
  enchants.forEach(enchant => {
    const id = ID_LIST[enchant[0]];
    const eObj = new ItemObj('book', enchant[1] * ENCHANTMENT2WEIGHT[id], [id]);
    eObj.c = { I: id, l: eObj.l, w: eObj.w };
    enchantObjs.push(eObj);
  });

  // Find most expensive enchant
  let mostExpensive = enchantObjs.reduce((maxIndex, item, currentIndex, array) => {
    return item.l > array[maxIndex].l ? currentIndex : maxIndex;
  }, 0);

  let item: ItemObject;
  if (itemName === 'book') {
    const id = enchantObjs[mostExpensive].e[0];
    item = new ItemObj(id, enchantObjs[mostExpensive].l);
    item.e.push(id);
    enchantObjs.splice(mostExpensive, 1);
    mostExpensive = enchantObjs.reduce((maxIndex, it, currentIndex, array) => {
      return it.l > array[maxIndex].l ? currentIndex : maxIndex;
    }, 0);
  } else {
    item = new ItemObj('item');
  }

  const mergedItem = new MergeEnchants(item, enchantObjs[mostExpensive]);
  mergedItem.c.L = { I: item.i, l: 0, w: 0 };
  enchantObjs.splice(mostExpensive, 1);

  const allObjs = enchantObjs.concat(mergedItem);
  const cheapestItems = cheapestItemsFromList(allObjs);

  let cheapestCost = Infinity;
  let cheapestKey = 0;

  for (const keyStr in cheapestItems) {
    const key = parseInt(keyStr);
    const itemObj = cheapestItems[key];
    let itemCost: number;

    if (mode === 'levels') {
      itemCost = itemObj.l;
    } else {
      itemCost = itemObj.x;
    }

    if (itemCost < cheapestCost) {
      cheapestCost = itemCost;
      cheapestKey = key;
    }
  }

  const cheapestItem = cheapestItems[cheapestKey];
  const instructions = getInstructions(cheapestItem.c);

  let maxLevels = 0;
  instructions.forEach(inst => {
    maxLevels += inst.levels;
  });
  const maxXp = experience(maxLevels);

  const endTime = performance.now();
  const timeMs = endTime - startTime;

  return {
    success: true,
    instructions,
    totalLevels: maxLevels,
    totalXp: maxXp,
    minXp: cheapestItem.x,
    item: cheapestItem,
    timeMs
  };
}
