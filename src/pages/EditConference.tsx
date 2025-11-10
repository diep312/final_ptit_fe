import { useState, useEffect } from "react";
import { Upload, UserPlus, MoreVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ConferenceLayout } from "@/components/layout/ConferenceLayout";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectTag } from "@/components/common/MultiSelectTag";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useApi } from "@/hooks/use-api";

interface Speaker {
  id: string | number;
  full_name: string;
  bio: string;
  email: string;
  phone: string;
  professional_title: string;
  linkedin_url: string;
  photo_url?: string;
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

const EditConference = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, safeRequest } = useApi();
  const [loading, setLoading] = useState(true);
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;
      
      const event = await safeRequest(() => api.get(`/organizer/events/${id}`));
      if (event) {
        // Parse event data
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        
        setFormData({
          name: event.name || "",
          description: event.description || "",
          category_id: event.category_id || "",
          startDate: startDate.toISOString().split("T")[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endDate: endDate.toISOString().split("T")[0],
          endTime: endDate.toTimeString().slice(0, 5),
          location: event.location || "",
          lat: event.lat?.toString() || "",
          lng: event.lng?.toString() || "",
          capacity: event.capacity?.toString() || "",
          tags: event.tags || [],
        });
        
        if (event.thumbnail) {
          setThumbnailPreview(event.thumbnail);
        }
        if (event.logo) {
          setLogoPreview(event.logo);
        }
        
        // Load speakers
        if (event.speakers && Array.isArray(event.speakers)) {
          const speakersData: Speaker[] = event.speakers.map((speaker: any) => ({
            id: speaker.id,
            full_name: speaker.full_name || "",
            bio: speaker.bio || "",
            email: speaker.email || "",
            phone: speaker.phone || "",
            professional_title: speaker.professional_title || "",
            linkedin_url: speaker.linkedin_url || "",
            photo_url: speaker.photo_url,
            avatar: null,
            avatarPreview: speaker.photo_url || null,
          }));
          setSpeakers(speakersData);
        }
      }
      setLoading(false);
    };
    
    loadEvent();
  }, [id, api, safeRequest]);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const speaker = speakers.find((s) => s.id.toString() === speakerId);
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
          speaker.id.toString() === editingSpeakerId
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
      setSpeakers(speakers.filter((speaker) => speaker.id.toString() !== editingSpeakerId));
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
    if (!id) return;
    
    setIsSubmitting(true);

    try {
      // Combine date and time
      const start_time = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
      const end_time = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        description: formData.description || "",
        start_time,
        end_time,
        location: formData.location,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        capacity: parseInt(formData.capacity),
      };

      if (formData.category_id) {
        updateData.category_id = formData.category_id;
      }
      if (formData.tags.length > 0) {
        updateData.tags = formData.tags;
      }
      if (thumbnailPreview && !thumbnail) {
        // Existing thumbnail URL
        updateData.thumbnail = thumbnailPreview;
      }
      if (logoPreview && !logo) {
        // Existing logo URL
        updateData.logo = logoPreview;
      }

      // Prepare speakers data
      const speakersData = speakers.map((speaker) => ({
        full_name: speaker.full_name,
        bio: speaker.bio,
        email: speaker.email,
        phone: speaker.phone,
        professional_title: speaker.professional_title,
        linkedin_url: speaker.linkedin_url,
        photo_url: speaker.avatar ? undefined : speaker.photo_url, // Keep existing if no new file
      }));

      updateData.speakers = speakersData;

      // If there are new files, use FormData, otherwise use JSON
      if (thumbnail || logo || speakers.some(s => s.avatar)) {
        const formDataToSend = new FormData();
        Object.keys(updateData).forEach((key) => {
          if (key === "speakers") {
            formDataToSend.append("speakers_json", JSON.stringify(updateData.speakers));
          } else if (key === "tags" && Array.isArray(updateData[key])) {
            updateData[key].forEach((tag: string) => {
              formDataToSend.append("tags[]", tag);
            });
          } else if (updateData[key] !== undefined && updateData[key] !== null) {
            formDataToSend.append(key, updateData[key]);
          }
        });

        if (thumbnail) {
          formDataToSend.append("thumbnail", thumbnail);
        }
        if (logo) {
          formDataToSend.append("logo", logo);
        }

        speakers.forEach((speaker, index) => {
          if (speaker.avatar) {
            formDataToSend.append(`speakers[${index}][photo_url]`, speaker.avatar);
          }
        });

        const result = await safeRequest(() =>
          api.put(`/organizer/events/${id}`, formDataToSend, {
            sendJson: false,
          })
        );

        if (result) {
          navigate(`/conference/${id}/dashboard`);
        }
      } else {
        // No new files, send as JSON
        const result = await safeRequest(() =>
          api.put(`/organizer/events/${id}`, updateData)
        );

        if (result) {
          navigate(`/conference/${id}/dashboard`);
        }
      }
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) {
      return;
    }

    const result = await safeRequest(() => api.delete(`/organizer/events/${id}`));
    if (result !== undefined) {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <ConferenceLayout showSidebar={false}>
        <div className="flex items-center justify-center h-screen">
          <p>Đang tải...</p>
        </div>
      </ConferenceLayout>
    );
  }

  return (
    <ConferenceLayout showSidebar={false}>
      <div className="max-w-6xl mx-auto py-6 px-6">
        <h1 className="font-heading text-4xl font-bold mb-8">Chỉnh sửa sự kiện</h1>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-card rounded-xl p-8 space-y-6 shadow-sm"
          >
            {/* Thumbnail Upload */}
            <div
              className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center py-10 text-center cursor-pointer hover:border-primary transition-colors"
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
                <div className="space-y-2">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">Nhấn để thay đổi hình ảnh</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Tải hình ảnh thumbnail</p>
                </>
              )}
            </div>

            {/* Logo Upload */}
            <div
              className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center py-10 text-center cursor-pointer hover:border-primary transition-colors"
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
                <div className="space-y-2">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-32 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">Nhấn để thay đổi logo</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Tải logo (tùy chọn)</p>
                </>
              )}
            </div>

            {/* Name */}
            <Input
              label="Tên sự kiện *"
              placeholder="Nhập tên của sự kiện tại đây..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Mô tả sự kiện</Label>
              <Textarea
                placeholder="Nhập mô tả về sự kiện..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            {/* Category */}
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

            {/* Tags */}
            <MultiSelectTag
              label="Thẻ (Tags)"
              placeholder="Thêm thẻ"
              options={[]}
              value={formData.tags}
              onChange={(selected) => setFormData({ ...formData, tags: selected })}
            />

            {/* Capacity */}
            <Input
              label="Số lượng người tham gia tối đa *"
              type="number"
              placeholder="Nhập số lượng tại đây"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
              min="1"
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
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Đến</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Địa điểm tổ chức *</Label>
              <Input
                placeholder="Trung tâm hội nghị Quốc Gia, TP. Hà Nội"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vĩ độ (Latitude) *"
                type="number"
                step="any"
                placeholder="21.0285"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                required
              />
              <Input
                label="Kinh độ (Longitude) *"
                type="number"
                step="any"
                placeholder="105.8542"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-between gap-4 pt-4">
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Xóa sự kiện
              </Button>
              <Button type="submit" className="px-8" disabled={isSubmitting}>
                {isSubmitting ? "Đang cập nhật..." : "Lưu thông tin"}
              </Button>
            </div>
          </form>

          {/* Right Reviewer Section */}
          <div className="flex flex-col">
            <div className="bg-card rounded-xl p-8 shadow-sm h-fit flex flex-col">
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
                        onClick={() => handleOpenSpeakerModal(speaker.id.toString())}
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

      {/* Speaker Modal - Same as CreateConference */}
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

export default EditConference;
