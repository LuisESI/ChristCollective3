import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, Upload, Image, Video, Type } from "lucide-react";

interface CreatePostModalProps {
  trigger?: React.ReactNode;
  onPostCreated?: () => void;
}



const MEDIA_TYPES = [
  { value: "image", label: "Image", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "text", label: "Text Only", icon: Type },
];

export function CreatePostModal({ trigger, onPostCreated }: CreatePostModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    authorType: "user",
    authorId: null,
    mediaType: "image",
    mediaUrls: [] as string[],
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's profile data to determine available author types
  const { data: creatorStatus } = useQuery({
    queryKey: ["/api/user/creator-status"],
  });

  const { data: businessProfiles } = useQuery({
    queryKey: ["/api/business-profiles"],
  });

  const { data: ministryProfile } = useQuery({
    queryKey: ["/api/user/ministry-profile"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return await apiRequest("/api/platform-posts", {
        method: "POST",
        data: postData,
      });
    },
    onSuccess: () => {
      toast({ title: "Post created successfully!" });
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      onPostCreated?.(); // Call the callback when post is created
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      authorType: "user",
      authorId: null,
      mediaType: "image",
      mediaUrls: [],
      tags: [],
    });
    setNewTag("");
    setNewMediaUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addMediaUrl = () => {
    if (newMediaUrl.trim() && !formData.mediaUrls.includes(newMediaUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, newMediaUrl.trim()]
      }));
      setNewMediaUrl("");
    }
  };

  const removeMediaUrl = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter(url => url !== urlToRemove)
    }));
  };

  const getAuthorOptions = () => {
    const options = [{ value: "user", label: "Personal Account", id: null }];

    if (creatorStatus && typeof creatorStatus === 'object' && 'isCreator' in creatorStatus && creatorStatus.isCreator && 'creatorProfile' in creatorStatus && creatorStatus.creatorProfile) {
      const creatorProfile = creatorStatus.creatorProfile as any;
      options.push({
        value: "creator",
        label: `Creator: ${creatorProfile.name}`,
        id: creatorProfile.id,
      });
    }

    if (Array.isArray(businessProfiles) && businessProfiles.length > 0) {
      businessProfiles.forEach((business: any) => {
        options.push({
          value: "business",
          label: `Business: ${business.companyName}`,
          id: business.id,
        });
      });
    }

    if (ministryProfile && typeof ministryProfile === 'object' && 'name' in ministryProfile && ministryProfile.name) {
      options.push({
        value: "ministry",
        label: `Ministry: ${ministryProfile.name}`,
        id: (ministryProfile as any).id,
      });
    }

    return options;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Author Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Post As</label>
            <Select
              value={formData.authorType}
              onValueChange={(value) => {
                const option = getAuthorOptions().find(opt => opt.value === value);
                setFormData(prev => ({
                  ...prev,
                  authorType: value,
                  authorId: option?.id || null,
                }));
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {getAuthorOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Title (Optional)</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Add a title to your post..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Content *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="What would you like to share?"
              rows={4}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Media Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Media Type</label>
            <div className="grid grid-cols-3 gap-2">
              {MEDIA_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.mediaType === type.value ? "default" : "outline"}
                    className={`flex items-center gap-2 ${
                      formData.mediaType === type.value
                        ? "bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                        : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, mediaType: type.value }))}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>



          {/* File Upload - Only show for Image/Video */}
          {formData.mediaType !== "text" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">
                Upload {formData.mediaType === "image" ? "Image" : "Video"}
              </label>
              
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">
                  Click to upload or drag and drop your {formData.mediaType}
                </p>
                <p className="text-xs text-gray-500">
                  {formData.mediaType === "image" ? "PNG, JPG, GIF up to 10MB" : "MP4, MOV up to 100MB"}
                </p>
                <input
                  type="file"
                  accept={formData.mediaType === "image" ? "image/*" : "video/*"}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // In a real app, you'd upload the file to a storage service
                      // For now, we'll use a placeholder URL
                      const fileUrl = URL.createObjectURL(file);
                      setFormData(prev => ({
                        ...prev,
                        mediaUrls: [...prev.mediaUrls, fileUrl]
                      }));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                >
                  Choose File
                </Button>
              </div>

              {/* Alternative: Add Media URL */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Or add media URL:</label>
                <div className="flex gap-2">
                  <Input
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder={`https://example.com/${formData.mediaType === "image" ? "image.jpg" : "video.mp4"}`}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                  <Button
                    type="button"
                    onClick={addMediaUrl}
                    className="bg-gray-700 hover:bg-gray-600"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Media Preview */}
              {formData.mediaUrls.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Preview</label>
                  <div className="grid gap-3">
                    {formData.mediaUrls.map((url, index) => (
                      <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden">
                        {formData.mediaType === "video" ? (
                          <video
                            controls
                            className="w-full max-h-64 object-contain"
                            style={{ maxHeight: '256px' }}
                          >
                            <source src={url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full max-h-64 object-contain"
                            style={{ maxHeight: '256px' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+";
                            }}
                          />
                        )}
                        
                        {/* Remove button */}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => removeMediaUrl(url)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        
                        {/* URL display */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2">
                          <p className="text-xs text-gray-300 truncate">
                            {url}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Tags</label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addTag}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-700 text-white flex items-center gap-1"
                  >
                    #{tag}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTag(tag)}
                      className="p-0 h-auto text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPostMutation.isPending}
              className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
            >
              {createPostMutation.isPending ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}