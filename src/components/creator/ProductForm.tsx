```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  creator_amount: z.number().min(0, 'Creator amount must be positive'),
  max_cause_amount: z.number().min(0, 'Maximum cause amount must be positive'),
  inventory_count: z.number().min(0, 'Inventory count must be positive'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ProductFormData>;
}

export function ProductForm({ onSubmit, onCancel, initialData }: ProductFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          {...register('category')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Select a category...</option>
          <option value="clothing">Clothing</option>
          <option value="accessories">Accessories</option>
          <option value="art">Art</option>
          <option value="digital">Digital</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Creator Amount (€)</label>
          <input
            type="number"
            step="0.01"
            {...register('creator_amount', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.creator_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.creator_amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Max Cause Amount (€)</label>
          <input
            type="number"
            step="0.01"
            {...register('max_cause_amount', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.max_cause_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.max_cause_amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Inventory Count</label>
          <input
            type="number"
            {...register('inventory_count', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.inventory_count && (
            <p className="mt-1 text-sm text-red-600">{errors.inventory_count.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-teal text-white px-4 py-2 rounded-md hover:bg-brand-teal-dark transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
```