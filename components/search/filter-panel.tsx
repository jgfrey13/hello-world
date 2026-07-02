import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MobileFilters } from "@/components/search/mobile-filters";
import {
  CLASSIFICATION_LABELS,
  MANUFACTURING_CLASSIFICATIONS,
} from "@/lib/verification/classification";
import type { CategoryListItem } from "@/lib/database/shapes";

interface FilterValues {
  q?: string;
  category?: string;
  classification?: string;
  state?: string;
  price?: number;
  sort?: string;
}

export interface FilterPanelProps {
  /** GET target, e.g. /brands or /products. */
  action: string;
  categories: CategoryListItem[];
  states: string[];
  values: FilterValues;
  /** Price band labels differ between brand price level and product price. */
  priceOptions: { value: number; label: string }[];
  sortOptions: { value: string; label: string }[];
  searchLabel: string;
}

function FilterFields({
  idPrefix,
  categories,
  states,
  values,
  priceOptions,
  sortOptions,
}: Pick<
  FilterPanelProps,
  "categories" | "states" | "values" | "priceOptions" | "sortOptions"
> & { idPrefix: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Select
          id={`${idPrefix}-category`}
          name="category"
          defaultValue={values.category ?? ""}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-classification`}>
          Manufacturing status
        </Label>
        <Select
          id={`${idPrefix}-classification`}
          name="classification"
          defaultValue={values.classification ?? ""}
        >
          <option value="">Any status</option>
          {MANUFACTURING_CLASSIFICATIONS.map((value) => (
            <option key={value} value={value}>
              {CLASSIFICATION_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-state`}>State</Label>
        <Select
          id={`${idPrefix}-state`}
          name="state"
          defaultValue={values.state ?? ""}
        >
          <option value="">Any state</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-price`}>Price</Label>
        <Select
          id={`${idPrefix}-price`}
          name="price"
          defaultValue={values.price ? String(values.price) : ""}
        >
          <option value="">Any price</option>
          {priceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-sort`}>Sort by</Label>
        <Select
          id={`${idPrefix}-sort`}
          name="sort"
          defaultValue={values.sort ?? ""}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

/**
 * Directory search + filters as plain GET forms: state lives in the URL,
 * results render server-side, everything works without JavaScript. Desktop
 * renders the fields inline; small screens get the same fields in an
 * accessible drawer with its own form (forms cannot nest, and portal content
 * cannot live inside the main form).
 */
export function FilterPanel(props: FilterPanelProps) {
  const { action, values, searchLabel } = props;
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <div className="flex gap-2">
          <label htmlFor="filter-q" className="sr-only">
            {searchLabel}
          </label>
          <Input
            id="filter-q"
            type="search"
            name="q"
            placeholder={searchLabel}
            defaultValue={values.q ?? ""}
            className="max-w-xl flex-1"
          />
          <Button type="submit">
            <Search aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Search</span>
          </Button>
        </div>
        <div className="hidden md:block">
          <FilterFields idPrefix="filter-desktop" {...props} />
        </div>
      </form>
      <MobileFilters>
        <form action={action} className="space-y-4">
          {values.q && <input type="hidden" name="q" value={values.q} />}
          <FilterFields idPrefix="filter-mobile" {...props} />
          <Button type="submit" className="w-full">
            Apply filters
          </Button>
        </form>
      </MobileFilters>
    </div>
  );
}
