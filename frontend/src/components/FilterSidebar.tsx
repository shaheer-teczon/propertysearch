import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PropertyFilters {
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  propertyType?: string;
  transactionType?: 'buy' | 'rent';
  search?: string;
}

interface FilterSidebarProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onApplyFilters: () => void;
  className?: string;
}

export const FilterSidebar = ({ filters, onFiltersChange, onApplyFilters, className }: FilterSidebarProps) => {
  const handleFilterChange = (key: keyof PropertyFilters, value: string | number | undefined) => {
    const updatedFilters = { ...filters, [key]: value };
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {};
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`bg-white border-r border-gray-200 h-full overflow-y-auto ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <Select 
              value={filters.transactionType || "any"} 
              onValueChange={(value) => handleFilterChange('transactionType', value && value !== "any" ? value as 'buy' | 'rent' : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="buy">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type
            </label>
            <Select 
              value={filters.propertyType || "any"} 
              onValueChange={(value) => handleFilterChange('propertyType', value && value !== "any" ? value : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <Select 
              value={filters.location || "any"} 
              onValueChange={(value) => handleFilterChange('location', value && value !== "any" ? value : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                <SelectItem value="Manhattan">Manhattan</SelectItem>
                <SelectItem value="New York City">New York City</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.priceMin || ''}
                onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.priceMax || ''}
                onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <Select 
              value={filters.bedrooms?.toString() || "any"} 
              onValueChange={(value) => handleFilterChange('bedrooms', value && value !== "any" ? Number(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="0">Studio</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms
            </label>
            <Select 
              value={filters.bathrooms?.toString() || "any"} 
              onValueChange={(value) => handleFilterChange('bathrooms', value && value !== "any" ? Number(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={onApplyFilters}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={activeFiltersCount === 0}
          >
            Apply Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
};