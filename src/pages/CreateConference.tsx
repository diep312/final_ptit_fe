import { useState } from "react";
import { Upload, UserPlus, Plus, X, MapPin, MoreVertical, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConferenceLayout } from "@/components/layout/ConferenceLayout";
import { ConferenceTopBar } from "@/components/conference/ConferenceTopBar";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectTag } from "@/components/common/MultiSelectTag";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useApi } from "@/hooks/use-api";
import { LocationPicker } from "@/components/common/LocationPicker";

interface Speaker {
  id: string;
  full_name: string;
  bio: string;
  email: string;
  phone: string;
  professional_title: string;
  linkedin_url: string;
  avatar: File | null;
  avatarPreview: string | null;
}

const EVENT_CATEGORIES = [
  { value: "ENVIRONMENT", label: "Môi trường" },
  { value: "ECONOMY", label: "Kinh tế" },
  { value: "EDUCATION", label: "Giáo dục" },
  { value: "HEALTH", label: "Y tế" },
  { value: "TECHNOLOGY", label: "Công nghệ" },
];

const CreateConference = () => {
  const navigate = useNavigate();
  const { api, safeRequest } = useApi();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [speakerForm, setSpeakerForm] = useState({
    full_name: "",
    bio: "",
    email: "",
    phone: "",
    professional_title: "",
    linkedin_url: "",
    avatar: null as File | null,
    avatarPreview: null as string | null,
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    lat: "",
    lng: "",
    capacity: "",
    tags: [] as string[],
    status: "waiting" as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Tên sự kiện là bắt buộc";
    } else if (formData.name.length > 100) {
      newErrors.name = "Tên sự kiện không được vượt quá 100 ký tự";
    }

    // Description validation
    if (formData.description && formData.description.length > 600) {
      newErrors.description = "Mô tả không được vượt quá 600 ký tự";
    }

    // Thumbnail validation
    if (!thumbnail) {
      newErrors.thumbnail = "Ảnh bìa sự kiện là bắt buộc";
    }

    // Capacity validation
    if (!formData.capacity) {
      newErrors.capacity = "Số lượng người tham gia là bắt buộc";
    } else if (parseInt(formData.capacity) < 1) {
      newErrors.capacity = "Số lượng người tham gia phải lớn hơn 0";
    }

    // Time validation
    if (!formData.startDate || !formData.startTime) {
      newErrors.startTime = "Thời gian bắt đầu là bắt buộc";
    } else {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const now = new Date();
      
      if (startDateTime < now) {
        newErrors.startTime = "Thời gian bắt đầu không được nhỏ hơn thời gian hiện tại";
      }
    }

    if (!formData.endDate || !formData.endTime) {
      newErrors.endTime = "Thời gian kết thúc là bắt buộc";
    } else if (formData.startDate && formData.startTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
      } else {
        const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
        if (durationMinutes < 5) {
          newErrors.endTime = "Sự kiện phải kéo dài ít nhất 5 phút";
        }
      }
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = "Địa điểm tổ chức là bắt buộc";
    }

    if (!formData.lat || !formData.lng) {
      newErrors.location = "Vui lòng chọn vị trí trên bản đồ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear thumbnail error when file is uploaded
      if (errors.thumbnail) {
        setErrors({ ...errors, thumbnail: "" });
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpeakerAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSpeakerForm({ ...speakerForm, avatar: file, avatarPreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenSpeakerModal = (speakerId?: string) => {
    if (speakerId) {
      const speaker = speakers.find((s) => s.id === speakerId);
      if (speaker) {
        setEditingSpeakerId(speakerId);
        setSpeakerForm({
          full_name: speaker.full_name,
          bio: speaker.bio,
          email: speaker.email,
          phone: speaker.phone,
          professional_title: speaker.professional_title,
          linkedin_url: speaker.linkedin_url,
          avatar: speaker.avatar,
          avatarPreview: speaker.avatarPreview,
        });
      }
    } else {
      setEditingSpeakerId(null);
      setSpeakerForm({
        full_name: "",
        bio: "",
        email: "",
        phone: "",
        professional_title: "",
        linkedin_url: "",
        avatar: null,
        avatarPreview: null,
      });
    }
    setIsSpeakerModalOpen(true);
  };

  const handleCloseSpeakerModal = () => {
    setIsSpeakerModalOpen(false);
    setEditingSpeakerId(null);
    setSpeakerForm({
      full_name: "",
      bio: "",
      email: "",
      phone: "",
      professional_title: "",
      linkedin_url: "",
      avatar: null,
      avatarPreview: null,
    });
  };

  const handleSaveSpeaker = () => {
    if (!speakerForm.full_name.trim() || !speakerForm.email.trim()) {
      return;
    }

    if (editingSpeakerId) {
      setSpeakers(
        speakers.map((speaker) =>
          speaker.id === editingSpeakerId
            ? {
                ...speaker,
                full_name: speakerForm.full_name,
                bio: speakerForm.bio,
                email: speakerForm.email,
                phone: speakerForm.phone,
                professional_title: speakerForm.professional_title,
                linkedin_url: speakerForm.linkedin_url,
                avatar: speakerForm.avatar,
                avatarPreview: speakerForm.avatarPreview,
              }
            : speaker
        )
      );
    } else {
      const newSpeaker: Speaker = {
        id: Date.now().toString(),
        full_name: speakerForm.full_name,
        bio: speakerForm.bio,
        email: speakerForm.email,
        phone: speakerForm.phone,
        professional_title: speakerForm.professional_title,
        linkedin_url: speakerForm.linkedin_url,
        avatar: speakerForm.avatar,
        avatarPreview: speakerForm.avatarPreview,
      };
      setSpeakers([...speakers, newSpeaker]);
    }
    handleCloseSpeakerModal();
  };

  const handleDeleteSpeaker = () => {
    if (editingSpeakerId) {
      setSpeakers(speakers.filter((speaker) => speaker.id !== editingSpeakerId));
      handleCloseSpeakerModal();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Combine date and time
      const start_time = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
      const end_time = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("start_time", start_time);
      formDataToSend.append("end_time", end_time);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("lat", formData.lat);
      formDataToSend.append("lng", formData.lng);
      formDataToSend.append("capacity", formData.capacity);
      if (formData.category_id) {
        formDataToSend.append("category_id", formData.category_id);
      }
      if (formData.tags.length > 0) {
        formData.tags.forEach((tag) => {
          formDataToSend.append("tags[]", tag);
        });
      }
      formDataToSend.append("thumbnail", thumbnail);
      if (logo) {
        formDataToSend.append("logo", logo);
      }

      // Add speakers data - send both as JSON and as form fields for file matching
      const speakersData = speakers.map((speaker) => ({
        full_name: speaker.full_name,
        bio: speaker.bio,
        email: speaker.email,
        phone: speaker.phone,
        professional_title: speaker.professional_title,
        linkedin_url: speaker.linkedin_url,
      }));

      // Send speakers metadata as JSON
      formDataToSend.append("speakers_json", JSON.stringify(speakersData));

      // Send speaker photos as files with nested fieldnames
      // Multer with express.urlencoded should create nested structure
      speakers.forEach((speaker, index) => {
        if (speaker.avatar) {
          formDataToSend.append(`speakers[${index}][photo_url]`, speaker.avatar);
        }
      });

      const result = await safeRequest(() =>
        api.post("/organizer/events", formDataToSend, {
          sendJson: false,
        })
      );

      if (result) {
        const createdEvent = (result as any)?.data ?? result;
        const eventId = createdEvent?._id;

        // If user selected to publish immediately, call the publish endpoint
        if (formData.status === "published" && eventId) {
          await safeRequest(() =>
            api.patch(`/organizer/events/${eventId}/publish`, { published: true })
          );
        }

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConferenceLayout showSidebar={false}>
      <ConferenceTopBar
        title="Tạo hội nghị mới"
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {formData.status === "published" ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Công khai
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Riêng tư
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, status: "published" })}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Công khai
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, status: "waiting" })}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Riêng tư
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="submit"
              form="create-conference-form"
              className="px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang tạo..." : "Lưu thông tin"}
            </Button>
          </>
        }
      />
      <div className="max-w-7xl mx-auto py-6 px-6">
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            id="create-conference-form"
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-card rounded-xl p-8 space-y-6 shadow-sm"
          >
            {/* Thumbnail Upload - Full width */}
            <div className="space-y-2 ">
              <Label className="text-base font-medium">Ảnh bìa sự kiện (16:9) *</Label>
              <div
                className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-6 text-center cursor-pointer hover:border-primary transition-colors aspect-video ${
                  errors.thumbnail ? 'border-destructive' : 'border-border'
                }`}
                onClick={() => document.getElementById("thumbnail-input")?.click()}
              >
                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                {thumbnailPreview ? (
                  <div className="space-y-2 px-4 w-full">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="max-h-24 mx-auto rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">Nhấn để thay đổi</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Tải ảnh bìa</p>
                    <p className="text-xs text-muted-foreground mt-1">Tỷ lệ 16:9</p>
                  </>
                )}
              </div>
              {errors.thumbnail && (
                <p className="text-sm text-destructive">{errors.thumbnail}</p>
              )}
            </div>

            {/* Name, Description, and Logo - Grouped */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6">
              <div className="space-y-6">
                {/* Name */}
                <Input
                  label="Tên sự kiện *"
                  placeholder="Nhập tên của sự kiện tại đây..."
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  error={errors.name}
                  required
                  maxLength={100}
                />

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Mô tả sự kiện
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formData.description.length}/600)
                    </span>
                  </Label>
                  <Textarea
                    placeholder="Nhập mô tả về sự kiện..."
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) setErrors({ ...errors, description: "" });
                    }}
                    rows={4}
                    maxLength={600}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Logo Upload - Right side */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Logo</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary transition-colors aspect-square"
                  onClick={() => document.getElementById("logo-input")?.click()}
                >
                  <input
                    id="logo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {logoPreview ? (
                    <div className="space-y-1 w-full">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-auto rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">Nhấn để thay đổi</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Tải logo</p>
                      <p className="text-xs text-muted-foreground mt-1">(1:1)</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Category and Capacity - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-medium">Danh mục</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                label="Số lượng người tham gia tối đa *"
                type="number"
                placeholder="Nhập số lượng tại đây"
                value={formData.capacity}
                onChange={(e) => {
                  setFormData({ ...formData, capacity: e.target.value });
                  if (errors.capacity) setErrors({ ...errors, capacity: "" });
                }}
                error={errors.capacity}
                required
                min="1"
              />
            </div>

            {/* Tags */}
            <MultiSelectTag
              label="Thẻ (Tags)"
              placeholder="Thêm thẻ"
              options={[]}
              value={formData.tags}
              onChange={(selected) => setFormData({ ...formData, tags: selected })}
            />

            {/* Time */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Thời gian *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Từ</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData({ ...formData, startDate: e.target.value });
                        if (errors.startTime) setErrors({ ...errors, startTime: "" });
                      }}
                      error={errors.startTime ? " " : ""}
                      required
                    />
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => {
                        setFormData({ ...formData, startTime: e.target.value });
                        if (errors.startTime) setErrors({ ...errors, startTime: "" });
                      }}
                      error={errors.startTime ? " " : ""}
                      required
                    />
                  </div>
                  {errors.startTime && (
                    <p className="text-sm text-destructive">{errors.startTime}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Đến</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => {
                        setFormData({ ...formData, endDate: e.target.value });
                        if (errors.endTime) setErrors({ ...errors, endTime: "" });
                      }}
                      error={errors.endTime ? " " : ""}
                      required
                    />
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => {
                        setFormData({ ...formData, endTime: e.target.value });
                        if (errors.endTime) setErrors({ ...errors, endTime: "" });
                      }}
                      error={errors.endTime ? " " : ""}
                      required
                    />
                  </div>
                  {errors.endTime && (
                    <p className="text-sm text-destructive">{errors.endTime}</p>
                  )}
                </div>
              </div>
            </div>



            {/* Map Location Picker */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Chọn vị trí trên bản đồ *</Label>
              <LocationPicker
                lat={formData.lat ? Number(formData.lat) : null}
                lng={formData.lng ? Number(formData.lng) : null}
                onLocationSelect={(lat, lng, locationName) => {
                  setFormData({
                    ...formData,
                    lat: lat.toString(),
                    lng: lng.toString(),
                    location: locationName,
                  });
                  if (errors.location) setErrors({ ...errors, location: "" });
                }}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Địa điểm tổ chức *</Label>
              <Input
                placeholder="Chọn vị trí trên bản đồ để tự động điền địa chỉ"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (errors.location) setErrors({ ...errors, location: "" });
                }}
                error={errors.location}
                required
              />
              <p className="text-xs text-muted-foreground">
                Địa chỉ sẽ tự động cập nhật khi bạn chọn vị trí trên bản đồ. Bạn cũng có thể chỉnh sửa thủ công.
              </p>
            </div>
          </form>

          {/* Right Reviewer Section */}
          <div className="flex flex-col">
            <div className="bg-card rounded-xl p-8 shadow-sm h-fit flex flex-col sticky top-32">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-medium text-lg">Danh sách diễn giả</h2>
                <Button variant="secondary" onClick={() => handleOpenSpeakerModal()}>
                  <UserPlus className="w-5 h-5 text-muted-foreground" />
                  Thêm diễn giả
                </Button>
              </div>

              {speakers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground border border-t-2 border-b-2 border-r-0 border-l-0 py-28">
                  <div className="mb-3">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                  </div>
                  <p>Hãy thêm diễn giả sẽ tham gia và phát trong hội nghị</p>
                </div>
              ) : (
                <div className="space-y-4 border-t pt-4">
                  {speakers.map((speaker) => (
                    <div
                      key={speaker.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-16 w-16">
                        {speaker.avatarPreview ? (
                          <AvatarImage src={speaker.avatarPreview} alt={speaker.full_name} />
                        ) : (
                          <AvatarFallback>{getInitials(speaker.full_name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{speaker.full_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {speaker.professional_title || speaker.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenSpeakerModal(speaker.id)}
                        className="flex-shrink-0"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Speaker Modal */}
      <Dialog open={isSpeakerModalOpen} onOpenChange={setIsSpeakerModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSpeakerId ? "Chỉnh sửa diễn giả" : "Thêm diễn giả"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Họ và tên diễn giả <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={speakerForm.full_name}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={speakerForm.email}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Số điện thoại</Label>
                <Input
                  type="tel"
                  placeholder="0123456789"
                  value={speakerForm.phone}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Chức danh / Vị trí công tác</Label>
                <Input
                  placeholder="CEO Công ty ABC Tech"
                  value={speakerForm.professional_title}
                  onChange={(e) =>
                    setSpeakerForm({ ...speakerForm, professional_title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">LinkedIn URL</Label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={speakerForm.linkedin_url}
                  onChange={(e) =>
                    setSpeakerForm({ ...speakerForm, linkedin_url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Giới thiệu, mô tả</Label>
                <Textarea
                  placeholder="Với hơn 15 năm kinh nghiệm trong phát triển hệ thống AI cho doanh nghiệp..."
                  value={speakerForm.bio}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })}
                  rows={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Ảnh đại diện</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById("speaker-avatar-input")?.click()}
              >
                <input
                  id="speaker-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleSpeakerAvatarUpload}
                  className="hidden"
                />
                {speakerForm.avatarPreview ? (
                  <div className="w-full h-full p-2">
                    <img
                      src={speakerForm.avatarPreview}
                      alt="Speaker avatar preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Tải hình ảnh mới ở đây</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {editingSpeakerId && (
                <Button variant="destructive" onClick={handleDeleteSpeaker}>
                  Xóa diễn giả
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseSpeakerModal}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveSpeaker}
                disabled={!speakerForm.full_name.trim() || !speakerForm.email.trim()}
              >
                Lưu thông tin
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConferenceLayout>
  );
};

export default CreateConference;
