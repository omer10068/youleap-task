"use client"

import { Check } from "lucide-react"
import type { Product } from "@/types/product"
import { getAvailableOptionValues } from "@/lib/variant-utils"

type VariantSelectorProps = {
  product: Product
  selection: Record<string, string>
  onSelect: (optionId: string, value: string) => void
}

export default function VariantSelector({ product, selection, onSelect }: VariantSelectorProps) {
  return (
    <div className="space-y-5">
      {product.options.map((option) => {
        const availableValues = getAvailableOptionValues(product, selection, option.id)
        const selectedValue = selection[option.id]

        return (
          <fieldset key={option.id}>
            <legend className="mb-2 flex items-baseline gap-2 text-sm font-medium text-stone-900">
              {option.title}
              {selectedValue && (
                <span className="text-xs font-normal text-stone-500">{selectedValue}</span>
              )}
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isAvailable = availableValues.includes(value)
                const isSelected = selectedValue === value

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => onSelect(option.id, value)}
                    aria-pressed={isSelected}
                    aria-label={`${option.title}: ${value}${isAvailable ? "" : " (unavailable)"}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "cursor-pointer border-stone-900 bg-stone-900 text-white"
                        : isAvailable
                          ? "cursor-pointer border-stone-300 bg-white text-stone-700 hover:border-stone-900/40 hover:bg-stone-50"
                          : "cursor-not-allowed border-dashed border-stone-300 bg-transparent text-stone-300 line-through hover:border-stone-300 hover:bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    {value}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
