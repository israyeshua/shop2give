import React from 'react';
import { useForm } from 'react-hook-form';
import { Editor } from '@tinymce/tinymce-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCampaigns } from '../../lib/campaigns';

type CampaignFormData = {
  title: string;
  description: string;
  goal_amount: number;
  start_date: string;
  end_date?: string;
};

interface CampaignFormProps {
  initialData?: {
    title: string;
    description: string;
    goalAmount: number;
    category: string;
  };
}

export function CampaignForm({ initialData }: CampaignFormProps = {}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CampaignFormData>({
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      goal_amount: initialData.goalAmount,
      start_date: new Date().toISOString().split('T')[0],
    } : undefined
  });
  const { createCampaign } = useCampaigns();
  const [mainImage, setMainImage] = React.useState<File | null>(null);
  const [description, setDescription] = React.useState('');

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: files => setMainImage(files[0])
  });

  const onSubmit = async (data: CampaignFormData) => {
    try {
      // Handle image upload to Supabase storage
      let main_image_url = '';
      if (mainImage) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-images')
          .upload(`${Date.now()}-${mainImage.name}`, mainImage);

        if (uploadError) throw uploadError;
        main_image_url = uploadData.path;
      }

      // Create campaign
      await createCampaign({
        ...data,
        description,
        main_image_url,
        current_amount: 0,
      });

    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Campaign Title
          </label>
          <input
            type="text"
            {...register('title', { required: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">Title is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Main Image
          </label>
          <div
            {...getRootProps()}
            className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-10"
          >
            <div className="text-center">
              <input {...getInputProps()} />
              {mainImage ? (
                <p>{mainImage.name}</p>
              ) : (
                <p>Drag and drop an image here, or click to select one</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Editor
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
            init={{
              height: 300,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                'fullscreen', 'insertdatetime', 'media', 'table', 'code',
                'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
            }}
            value={description}
            onEditorChange={setDescription}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Goal Amount (€)
            </label>
            <input
              type="number"
              {...register('goal_amount', { required: true, min: 1 })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.goal_amount && (
              <p className="mt-1 text-sm text-red-600">
                Goal amount must be greater than 0
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              {...register('start_date', { required: true })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">Start date is required</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date (Optional)
            </label>
            <input
              type="date"
              {...register('end_date')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Create Campaign
        </Button>
      </form>
    </Card>
  );
}