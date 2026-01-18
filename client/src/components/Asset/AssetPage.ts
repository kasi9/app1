import type { Asset } from "../../types/Asset.type";

type SortRule = { field: string; order: "asc" | "desc" };
type FilterRule = { field: string; value: string };

interface PaginationInput {
  assets: Asset[];
  pageNo?: number;
  pageSize?: number;
  search?: string;
  filterRules?: FilterRule[];
  sortRules?: SortRule[];
  tags?: string[];
}

export function getAssetsByPaginationClient({
  assets,
  pageNo = 1,
  pageSize = 10,
  search = "",
  filterRules = [],
  sortRules = [],
  tags = [],
}: PaginationInput) {

  let filteredAssets = [...assets];

  /* ---------------- SEARCH (OR condition) ---------------- */
  if (search && search !== "_") {
    const s = search.toLowerCase();

    filteredAssets = filteredAssets.filter(asset =>
      asset.assetType?.toLowerCase().includes(s) ||
      asset.code?.toLowerCase().includes(s) ||
      asset.title?.toLowerCase().includes(s) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(s))
    );
  }

  /* ---------------- FILTER RULES (AND condition) ---------------- */
  if (filterRules.length) {
    filteredAssets = filteredAssets.filter(asset =>
      filterRules.every(rule => {
        const value = (asset as any)[rule.field];

        if (!value) return false;

        if (Array.isArray(value)) {
          return value.some(v =>
            v.toLowerCase().includes(rule.value.toLowerCase())
          );
        }

        return value
          .toString()
          .toLowerCase()
          .includes(rule.value.toLowerCase());
      })
    );
  }

  /* ---------------- TAGS FILTER ($all equivalent) ---------------- */
  if (tags.length) {
    filteredAssets = filteredAssets.filter(asset =>
      tags.every(tag => asset.tags?.includes(tag))
    );
  }

  /* ---------------- SORT ---------------- */
  if (sortRules.length) {
    filteredAssets.sort((a, b) => {
      for (const rule of sortRules) {
        const aVal = (a as any)[rule.field];
        const bVal = (b as any)[rule.field];

        if (aVal === bVal) continue;

        if (rule.order === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      }
      return 0;
    });
  } /*else {
    // default sort by createdAt desc
    filteredAssets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }*/

  /* ---------------- PAGINATION ---------------- */
  const totalRows = filteredAssets.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const startIndex = (pageNo - 1) * pageSize;
  const paginatedData = filteredAssets.slice(
    startIndex,
    startIndex + pageSize
  );

  return {
    result: paginatedData,
    totalRows,
    totalPages,
  };
}
