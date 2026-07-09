"use client"

import type { Product } from "@/types/product"
import { getAvailableOptionValues } from "@/lib/variant-utils"

type VariantSelectorProps = {
  product: Product
  selection: Record<string, string>
  onSelect: (optionId: string, value: string) => void
}

export default function VariantSelector({ product, selection, onSelect }: VariantSelectorProps) {
  return (
    <div className="space-y-4">
      {product.options.map((option) => {
        const availableValues = getAvailableOptionValues(product, selection, option.id)

        return (
          <div key={option.id}>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              {option.title}
            </span>
            <div role="group" aria-label={option.title} className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isAvailable = availableValues.includes(value)
                const isSelected = selection[option.id] === value

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => onSelect(option.id, value)}
                    aria-pressed={isSelected}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : isAvailable
                          ? "border-gray-300 bg-white text-gray-700 hover:border-black"
                          : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 line-through"
                    }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
