
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: any;
  onSave: () => void;
}

export function EditPlatformModal({ isOpen, onClose, platform, onSave }: EditPlatformModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (platform) {
      setName(platform.name || '');
      setUrl(platform.url || '');
      setDescription(platform.description || '');
    }
  }, [platform]);

  const handleSave = async () => {
    if (!name || !url) {
      toast({
        title: "Error",
        description: "Platform name and URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('platforms')
        .update({
          name,
          url,
          description,
        })
        .eq('id', platform.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Platform updated successfully!",
      });

      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this platform? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', platform.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Platform deleted successfully!",
      });

      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Platform</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-300">Platform Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., HackerOne, Bugcrowd"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="url" className="text-gray-300">Platform URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Platform description..."
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>





          <div className="flex space-x-2">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 flex-1">
              Save Changes
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
            <Button variant="outline" onClick={onClose} className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
