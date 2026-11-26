import Problem from "../models/Problem.js";

// [title, difficulty, leetcode-slug]  — grouped by topic, in the order shown on the sheet.
const E = "Easy", M = "Medium", H = "Hard";

const SHEET = {
  "Arrays & Hashing": [
    ["Two Sum", E, "two-sum"],
    ["Contains Duplicate", E, "contains-duplicate"],
    ["Valid Anagram", E, "valid-anagram"],
    ["Majority Element", E, "majority-element"],
    ["Move Zeroes", E, "move-zeroes"],
    ["Group Anagrams", M, "group-anagrams"],
    ["Top K Frequent Elements", M, "top-k-frequent-elements"],
    ["Product of Array Except Self", M, "product-of-array-except-self"],
    ["Longest Consecutive Sequence", M, "longest-consecutive-sequence"]
  ],
  "Two Pointers": [
    ["Valid Palindrome", E, "valid-palindrome"],
    ["Remove Duplicates from Sorted Array", E, "remove-duplicates-from-sorted-array"],
    ["3Sum", M, "3sum"],
    ["Container With Most Water", M, "container-with-most-water"],
    ["Trapping Rain Water", H, "trapping-rain-water"]
  ],
  "Sliding Window": [
    ["Best Time to Buy and Sell Stock", E, "best-time-to-buy-and-sell-stock"],
    ["Longest Substring Without Repeating Characters", M, "longest-substring-without-repeating-characters"],
    ["Longest Repeating Character Replacement", M, "longest-repeating-character-replacement"],
    ["Permutation in String", M, "permutation-in-string"],
    ["Minimum Window Substring", H, "minimum-window-substring"],
    ["Sliding Window Maximum", H, "sliding-window-maximum"]
  ],
  "Stack": [
    ["Valid Parentheses", E, "valid-parentheses"],
    ["Next Greater Element I", E, "next-greater-element-i"],
    ["Min Stack", M, "min-stack"],
    ["Daily Temperatures", M, "daily-temperatures"],
    ["Evaluate Reverse Polish Notation", M, "evaluate-reverse-polish-notation"],
    ["Largest Rectangle in Histogram", H, "largest-rectangle-in-histogram"]
  ],
  "Binary Search": [
    ["Binary Search", E, "binary-search"],
    ["Search a 2D Matrix", M, "search-a-2d-matrix"],
    ["Koko Eating Bananas", M, "koko-eating-bananas"],
    ["Find Minimum in Rotated Sorted Array", M, "find-minimum-in-rotated-sorted-array"],
    ["Search in Rotated Sorted Array", M, "search-in-rotated-sorted-array"],
    ["Median of Two Sorted Arrays", H, "median-of-two-sorted-arrays"]
  ],
  "Linked List": [
    ["Reverse Linked List", E, "reverse-linked-list"],
    ["Merge Two Sorted Lists", E, "merge-two-sorted-lists"],
    ["Linked List Cycle", E, "linked-list-cycle"],
    ["Reorder List", M, "reorder-list"],
    ["Remove Nth Node From End of List", M, "remove-nth-node-from-end-of-list"],
    ["Add Two Numbers", M, "add-two-numbers"],
    ["Find the Duplicate Number", M, "find-the-duplicate-number"],
    ["Copy List with Random Pointer", M, "copy-list-with-random-pointer"],
    ["LRU Cache", M, "lru-cache"],
    ["Merge k Sorted Lists", H, "merge-k-sorted-lists"],
    ["Reverse Nodes in k-Group", H, "reverse-nodes-in-k-group"]
  ],
  "Trees": [
    ["Invert Binary Tree", E, "invert-binary-tree"],
    ["Maximum Depth of Binary Tree", E, "maximum-depth-of-binary-tree"],
    ["Diameter of Binary Tree", E, "diameter-of-binary-tree"],
    ["Balanced Binary Tree", E, "balanced-binary-tree"],
    ["Same Tree", E, "same-tree"],
    ["Subtree of Another Tree", E, "subtree-of-another-tree"],
    ["Lowest Common Ancestor of a Binary Search Tree", M, "lowest-common-ancestor-of-a-binary-search-tree"],
    ["Binary Tree Level Order Traversal", M, "binary-tree-level-order-traversal"],
    ["Binary Tree Right Side View", M, "binary-tree-right-side-view"],
    ["Validate Binary Search Tree", M, "validate-binary-search-tree"],
    ["Kth Smallest Element in a BST", M, "kth-smallest-element-in-a-bst"],
    ["Construct Binary Tree from Preorder and Inorder Traversal", M, "construct-binary-tree-from-preorder-and-inorder-traversal"],
    ["Binary Tree Maximum Path Sum", H, "binary-tree-maximum-path-sum"],
    ["Serialize and Deserialize Binary Tree", H, "serialize-and-deserialize-binary-tree"]
  ],
  "Heap / Priority Queue": [
    ["Kth Largest Element in a Stream", E, "kth-largest-element-in-a-stream"],
    ["Last Stone Weight", E, "last-stone-weight"],
    ["Kth Largest Element in an Array", M, "kth-largest-element-in-an-array"],
    ["K Closest Points to Origin", M, "k-closest-points-to-origin"],
    ["Task Scheduler", M, "task-scheduler"],
    ["Find Median from Data Stream", H, "find-median-from-data-stream"]
  ],
  "Backtracking": [
    ["Subsets", M, "subsets"],
    ["Permutations", M, "permutations"],
    ["Combination Sum", M, "combination-sum"],
    ["Letter Combinations of a Phone Number", M, "letter-combinations-of-a-phone-number"],
    ["Word Search", M, "word-search"],
    ["Palindrome Partitioning", M, "palindrome-partitioning"],
    ["N-Queens", H, "n-queens"]
  ],
  "Graphs": [
    ["Number of Islands", M, "number-of-islands"],
    ["Max Area of Island", M, "max-area-of-island"],
    ["Clone Graph", M, "clone-graph"],
    ["Rotting Oranges", M, "rotting-oranges"],
    ["Pacific Atlantic Water Flow", M, "pacific-atlantic-water-flow"],
    ["Surrounded Regions", M, "surrounded-regions"],
    ["Course Schedule", M, "course-schedule"],
    ["Course Schedule II", M, "course-schedule-ii"],
    ["Redundant Connection", M, "redundant-connection"],
    ["Network Delay Time", M, "network-delay-time"],
    ["Cheapest Flights Within K Stops", M, "cheapest-flights-within-k-stops"],
    ["Word Ladder", H, "word-ladder"]
  ],
  "Dynamic Programming": [
    ["Climbing Stairs", E, "climbing-stairs"],
    ["House Robber", M, "house-robber"],
    ["House Robber II", M, "house-robber-ii"],
    ["Longest Palindromic Substring", M, "longest-palindromic-substring"],
    ["Palindromic Substrings", M, "palindromic-substrings"],
    ["Decode Ways", M, "decode-ways"],
    ["Coin Change", M, "coin-change"],
    ["Maximum Product Subarray", M, "maximum-product-subarray"],
    ["Word Break", M, "word-break"],
    ["Longest Increasing Subsequence", M, "longest-increasing-subsequence"],
    ["Partition Equal Subset Sum", M, "partition-equal-subset-sum"],
    ["Unique Paths", M, "unique-paths"],
    ["Longest Common Subsequence", M, "longest-common-subsequence"],
    ["Best Time to Buy and Sell Stock with Cooldown", M, "best-time-to-buy-and-sell-stock-with-cooldown"],
    ["Target Sum", M, "target-sum"],
    ["Edit Distance", M, "edit-distance"],
    ["Burst Balloons", H, "burst-balloons"]
  ],
  "Greedy": [
    ["Maximum Subarray", M, "maximum-subarray"],
    ["Jump Game", M, "jump-game"],
    ["Jump Game II", M, "jump-game-ii"],
    ["Gas Station", M, "gas-station"],
    ["Hand of Straights", M, "hand-of-straights"],
    ["Partition Labels", M, "partition-labels"]
  ],
  "Intervals": [
    ["Merge Intervals", M, "merge-intervals"],
    ["Insert Interval", M, "insert-interval"],
    ["Non-overlapping Intervals", M, "non-overlapping-intervals"]
  ],
  "Math & Bit Manipulation": [
    ["Number of 1 Bits", E, "number-of-1-bits"],
    ["Counting Bits", E, "counting-bits"],
    ["Reverse Bits", E, "reverse-bits"],
    ["Missing Number", E, "missing-number"],
    ["Single Number", E, "single-number"],
    ["Happy Number", E, "happy-number"],
    ["Sum of Two Integers", M, "sum-of-two-integers"],
    ["Rotate Image", M, "rotate-image"],
    ["Spiral Matrix", M, "spiral-matrix"],
    ["Set Matrix Zeroes", M, "set-matrix-zeroes"],
    ["Pow(x, n)", M, "powx-n"]
  ],
  "Tries": [
    ["Implement Trie (Prefix Tree)", M, "implement-trie-prefix-tree"],
    ["Design Add and Search Words Data Structure", M, "design-add-and-search-words-data-structure"],
    ["Word Search II", H, "word-search-ii"]
  ]
};

export const buildSeed = () => {
  let order = 0;
  return Object.entries(SHEET).flatMap(([topic, rows]) =>
    rows.map(([title, difficulty, slug]) => ({
      title, topic, difficulty, url: `https://leetcode.com/problems/${slug}/`, order: ++order
    })));
};

// Runs on every server start. Adds any missing built-in questions and refreshes their
// topic/difficulty/link/order. It never touches user progress or custom questions.
export async function seedProblems() {
  const rows = buildSeed();
  await Problem.bulkWrite(rows.map((r) => ({
    updateOne: {
      filter: { userId: null, title: r.title },
      update: { $set: { topic: r.topic, difficulty: r.difficulty, url: r.url, order: r.order } },
      upsert: true
    }
  })));
  return rows.length;
}
