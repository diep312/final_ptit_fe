import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { ConferenceLayout } from "@/components/layout/ConferenceLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Upload, Trash2, Check, GripVertical, Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldType = "text" | "textarea" | "multipleChoice" | "email" | "number" | "date";

type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[]; // For multiple choice
  isDefault?: boolean; // For name and email fields
};

type FormManagementProps = {};

const FormManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, safeRequest } = useApi()

  const getDefaultFieldDescription = (fieldLabel?: string, fieldType?: string) => {
    const label = (fieldLabel || '').toLowerCase();

    if (fieldType === 'EMAIL' || label.includes('email')) {
      return 'Email dùng để liên hệ và xác nhận đăng ký.';
    }
    if (label.includes('họ và tên') || label.includes('ho va ten') || label.includes('họ tên') || label.includes('ho ten')) {
      return 'Vui lòng nhập họ và tên đầy đủ.';
    }
    if (label.includes('ngày sinh') || label.includes('ngay sinh')) {
      return 'Vui lòng chọn ngày sinh.';
    }
    if (label.includes('giới tính') || label.includes('gioi tinh')) {
      return 'Vui lòng chọn giới tính.';
    }
    return '';
  }

  // Form state
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);

  // Dialog state
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [newField, setNewField] = useState<Partial<FormField>>({
    label: "",
    type: "text",
    required: false,
    placeholder: "Điền thông tin tham gia tại đây...",
    description: "",
  });

  // Mock form info (replace with API)
  const [formId, setFormId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [statistics, setStatistics] = useState<{ registered: number }>({ registered: 0 });

  const formInfo = {
    displayStatus: isPublished ? "Đã xuất bản" : "Chưa xuất bản",
    maxRegistrations: eventData?.data?.capacity ? String(eventData.data.capacity) : "N/A",
    currentRegistrations: statistics.registered,
    contactEmail: eventData?.organizer?.email || eventData?.contact_email || "N/A",
  };

  const fieldTypeLabels: Record<FieldType, string> = {
    text: "Đáp án ngắn",
    textarea: "Đáp án dài",
    multipleChoice: "Nhiều lựa chọn",
    email: "Email",
    number: "Số",
    date: "Ngày",
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
    }
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((field) => {
        // Don't allow updating default fields except for label
        if (field.isDefault && !updates.label) return field;
        return field.id === fieldId ? { ...field, ...updates } : field;
      })
    );
  };

  const handleFieldDelete = (fieldId: string) => {
    setFields((prev) => prev.filter((field) => !field.isDefault && field.id !== fieldId));
  };

  const handleAddField = () => {
    if (!newField.label) return;

    const field: FormField = {
      id: Date.now().toString(),
      label: newField.label,
      type: (newField.type || "text") as FieldType,
      required: newField.required || false,
      placeholder: newField.placeholder || "Điền thông tin tham gia tại đây...",
      description: newField.description || "",
      options: newField.type === "multipleChoice" ? [] : undefined,
    };

    setFields((prev) => [...prev, field]);
    setNewField({
      label: "",
      type: "text",
      required: false,
      placeholder: "Điền thông tin tham gia tại đây...",
      description: "",
    });
    setIsAddFieldDialogOpen(false);
  };

  const handleAddOption = (fieldId: string) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === fieldId && field.type === "multipleChoice") {
          return {
            ...field,
            options: [...(field.options || []), `Tùy chọn ${(field.options?.length || 0) + 1}`],
          };
        }
        return field;
      })
    );
  };

  const handleUpdateOption = (fieldId: string, optionIndex: number, value: string) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options];
          newOptions[optionIndex] = value;
          return { ...field, options: newOptions };
        }
        return field;
      })
    );
  };

  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === fieldId && field.options) {
          return {
            ...field,
            options: field.options.filter((_, idx) => idx !== optionIndex),
          };
        }
        return field;
      })
    );
  };

  const handleReorderFields = (newOrder: FormField[]) => {
    setFields(newOrder);
    setIsReorderDialogOpen(false);
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Don't allow moving default fields (name, email) below custom fields
    const currentField = newFields[index];
    const targetField = newFields[targetIndex];
    
    if (currentField.isDefault && !targetField.isDefault && direction === "down") return;
    if (!currentField.isDefault && targetField.isDefault && direction === "up") return;

    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const handlePublish = async () => {
    await saveForm(true);
  };

  const mapFieldToPayload = (f: FormField, position: number) => {
    const FIELD_TYPE_MAP: Record<string, string> = {
      text: 'TEXT',
      textarea: 'TEXTAREA',
      multipleChoice: 'RADIO',
      email: 'EMAIL',
      number: 'NUMBER',
      date: 'DATE'
    }

    return {
      field_label: f.label,
      field_description: f.description || '',
      field_type: FIELD_TYPE_MAP[f.type] || 'TEXT',
      field_options: f.options || [],
      field_has_other_option: false,
      field_range: { min: null, max: null },
      field_extensions: [],
      required: !!f.required,
      is_primary_key: !!f.isDefault,
      can_edit: true,
      position
    }
  }

  const saveForm = async (publish = false) => {
    if (!id) return
    const payload = {
      title: formTitle || `Form đăng ký ${id}`,
      description: formDescription,
      is_public: publish || isPublished,
      fields: fields.map((f, idx) => ({
        _id: f.id,
        ...mapFieldToPayload(f, idx)
      }))
    }

    setLoading(true)
    await safeRequest(async () => {
      if (formId) {
        // update form with fields
        const updated: any = await api.put(`/organizer/events/forms/${formId}/with-fields`, payload)
        if (updated) {
          if (publish) setIsPublished(true);
          // Reload fields to get updated IDs for new fields
          const form: any = await api.get(`/organizer/events/forms/event/${id}`)
          if (form && form.fields) {
            const mapped = (form.fields || []).map((f: any, idx: number) => {
              const TYPE_MAP: Record<string, any> = {
                TEXT: 'text',
                TEXTAREA: 'textarea',
                RADIO: 'multipleChoice',
                CHECKBOX: 'multipleChoice',
                EMAIL: 'email',
                NUMBER: 'number',
                DATE: 'date'
              }
              const fieldDescription = (f.field_description && String(f.field_description).trim().length > 0)
                ? f.field_description
                : (f.is_primary_key ? getDefaultFieldDescription(f.field_label, f.field_type) : '');
              return {
                id: f._id || String(idx),
                label: f.field_label,
                type: TYPE_MAP[f.field_type] || 'text',
                required: !!f.required,
                options: f.field_options || [],
                description: fieldDescription,
                isDefault: !!f.is_primary_key
              }
            })
            if (mapped.length > 0) setFields(mapped)
          }
        }
      } else {
        // create form with fields
        const created: any = await api.post('/organizer/events/forms', payload)
        if (created?.form && created.form._id) {
          setFormId(created.form._id)
          if (publish) setIsPublished(true);
          // Reload to get proper field IDs
          const form: any = await api.get(`/organizer/events/forms/event/${id}`)
          if (form && form.fields) {
            const mapped = (form.fields || []).map((f: any, idx: number) => {
              const TYPE_MAP: Record<string, any> = {
                TEXT: 'text',
                TEXTAREA: 'textarea',
                RADIO: 'multipleChoice',
                CHECKBOX: 'multipleChoice',
                EMAIL: 'email',
                NUMBER: 'number',
                DATE: 'date'
              }
              const fieldDescription = (f.field_description && String(f.field_description).trim().length > 0)
                ? f.field_description
                : (f.is_primary_key ? getDefaultFieldDescription(f.field_label, f.field_type) : '');
              return {
                id: f._id || String(idx),
                label: f.field_label,
                type: TYPE_MAP[f.field_type] || 'text',
                required: !!f.required,
                options: f.field_options || [],
                description: fieldDescription,
                isDefault: !!f.is_primary_key
              }
            })
            if (mapped.length > 0) setFields(mapped)
          }
        }
      }
    })
    setLoading(false)
  }

  useEffect(() => {
    // Load existing form by event id
    if (!id) return
    
    const loadData = async () => {
      // Load event data
      const event: any = await safeRequest(() => api.get(`/organizer/events/${id}`))
      if (event) {
        setEventData(event)
      }


      // Load form data
      const form: any = await safeRequest(() => api.get(`/organizer/events/forms/event/${id}`))
      if (form) {
        setFormId(form._id)
        setFormTitle(form.title || '')
        setFormDescription(form.description || '')
        setIsPublished(!!form.is_public)
        // map fields from backend to local representation
        const mapped = (form.fields || []).map((f: any, idx: number) => {
          const TYPE_MAP: Record<string, any> = {
            TEXT: 'text',
            TEXTAREA: 'textarea',
            RADIO: 'multipleChoice',
            CHECKBOX: 'multipleChoice',
            EMAIL: 'email',
            NUMBER: 'number',
            DATE: 'date'
          }
          const fieldDescription = (f.field_description && String(f.field_description).trim().length > 0)
            ? f.field_description
            : (f.is_primary_key ? getDefaultFieldDescription(f.field_label, f.field_type) : '');
          return {
            id: f._id || String(idx),
            label: f.field_label,
            type: TYPE_MAP[f.field_type] || 'text',
            required: !!f.required,
            options: f.field_options || [],
            description: fieldDescription,
            isDefault: !!f.is_primary_key
          }
        })
        if (mapped.length > 0) setFields(mapped)
        // Only load registration statistics if form is public
        if (form.is_public) {
          const stRes: any = await safeRequest(() => api.get(`/organizer/events/${id}/statistics`));
          const stData = (stRes as any)?.data ?? stRes ?? null;
          if (stData) {
            setStatistics({
              registered: stData.registered ?? stData.totalRegistrations ?? 0,
            });
          }
        } else {
          setStatistics({ registered: 0 });
        }
      }
    }

    loadData()
  }, [id])

  return (
    <ConferenceLayout sidebarTitle="Hội nghị Công nghệ Số Việt Nam 2025">
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Form đăng ký</h1>
                <p className="text-muted-foreground mt-1">
                  Hội nghị Công nghệ Số Việt Nam 2025
                </p>
              </div>
            </div>
          </div>

          {/* Form Title and Description */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-title">Tiêu đề form</Label>
                <Input
                  id="form-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nhập tiêu đề form đăng ký..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-description">Mô tả form</Label>
                <Textarea
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Nhập mô tả cho form đăng ký..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail Upload
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="thumbnail" className="block mb-2">
                Hình ảnh thumbnail của form
              </Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
                  "hover:bg-muted/50 transition-colors",
                  thumbnailPreview && "border-primary"
                )}
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
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Tải hình ảnh mới ở đây
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card> */}

          {/* Form Fields */}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Field Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-auto">
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            value={field.label}
                            onChange={(e) => handleFieldUpdate(field.id, { label: e.target.value })}
                            className="text-base font-heading border-0 border-b-2 border-border rounded-none h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                            placeholder="Nhập nhãn trường..."
                            disabled={field.isDefault}
                          />
                          {field.required && <span className="text-red-500">*</span>}
                          {field.isDefault && (
                            <span className="text-xs w-fit text-muted-foreground bg-muted px-4 py-1 rounded">
                              Trường mặc định
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-3">
                          <Label className="text-sm text-muted-foreground">Mô tả câu hỏi</Label>
                          <Textarea
                            value={field.description || ""}
                            onChange={(e) => handleFieldUpdate(field.id, { description: e.target.value })}
                            placeholder="Nhập mô tả (không bắt buộc)..."
                            rows={2}
                            disabled={field.isDefault}
                          />
                        </div>

                        {/* Input based on type */}
                        {field.type === "textarea" ? (
                          <Textarea
                            id={`field-${field.id}`}
                            placeholder={field.placeholder}
                            disabled
                            className="min-h-[100px]"
                          />
                        ) : field.type === "multipleChoice" ? (
                          <div className="space-y-2">
                            {field.options?.map((option, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    handleUpdateOption(field.id, optIdx, e.target.value)
                                  }
                                  placeholder="Tùy chọn"
                                  className="flex-1"
                                  disabled={field.isDefault}
                                />
                                {!field.isDefault && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveOption(field.id, optIdx)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {!field.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddOption(field.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm tùy chọn
                              </Button>
                            )}
                          </div>
                        ) : field.type === "date" ? (
                          <Input
                            id={`field-${field.id}`}
                            type="date"
                            placeholder={field.placeholder}
                            disabled
                          />
                        ) : (
                          <Input
                            id={`field-${field.id}`}
                            type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                            placeholder={field.placeholder}
                            disabled
                          />
                        )}
                      </div>

                      {/* Field Type Selector */}
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          handleFieldUpdate(field.id, {
                            type: value as FieldType,
                            options: value === "multipleChoice" ? [] : undefined,
                          })
                        }
                        disabled={field.isDefault}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(fieldTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Field Options */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">
                          *Câu hỏi bắt buộc
                        </span>
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            handleFieldUpdate(field.id, { required: checked })
                          }
                          disabled={field.isDefault}
                        />
                      </div>
                      {!field.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFieldDelete(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Field Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAddFieldDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm trường mới
          </Button>

          {/* Add/Reorder Fields Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsReorderDialogOpen(true)}
          >
            <GripVertical className="h-4 w-4 mr-2" />
            Thêm / Sắp xếp lại các trường
          </Button>
        </div>

        {/* Right Sidebar - Sticky Info Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin form đăng ký</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Hiển thị:</Label>
                  <p className="font-medium">{formInfo.displayStatus}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Số lượng đăng ký tối đa:</Label>
                  <p className="font-medium">{formInfo.maxRegistrations}</p>
                </div>
                {isPublished && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Số lượng đăng ký hiện tại:</Label>
                    <p className="font-medium">{formInfo.currentRegistrations}</p>
                  </div>
                )}
                {/* <div>
                  <Label className="text-sm text-muted-foreground">Email liên hệ:</Label>
                  <p className="font-medium">{formInfo.contactEmail}</p>
                </div> */}
                <div className="pt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => saveForm(false)} 
                    disabled={loading}
                  >
                    Lưu nháp
                  </Button>
                  <Button 
                    className="w-full" 
                    onClick={handlePublish} 
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Xuất bản
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Field Dialog */}
      <Dialog
        open={isAddFieldDialogOpen}
        onOpenChange={(open) => {
          setIsAddFieldDialogOpen(open);
          // If closing and reorder dialog is open, don't do anything special
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm trường mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-field-label">Nhãn trường</Label>
              <Input
                id="new-field-label"
                value={newField.label}
                onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Nhập nhãn trường..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-field-description">Mô tả câu hỏi</Label>
              <Textarea
                id="new-field-description"
                value={newField.description || ""}
                onChange={(e) => setNewField((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả (không bắt buộc)..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-field-type">Loại trường</Label>
              <Select
                value={newField.type}
                onValueChange={(value) =>
                  setNewField((prev) => ({
                    ...prev,
                    type: value as FieldType,
                    options: value === "multipleChoice" ? [] : undefined,
                  }))
                }
              >
                <SelectTrigger id="new-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fieldTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newField.type === "multipleChoice" && (
              <div className="space-y-2">
                <Label>Tùy chọn</Label>
                <div className="space-y-2">
                  {(newField.options || []).map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(newField.options || [])];
                          newOptions[idx] = e.target.value;
                          setNewField((prev) => ({ ...prev, options: newOptions }));
                        }}
                        placeholder="Tùy chọn"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOptions = (newField.options || []).filter((_, i) => i !== idx);
                          setNewField((prev) => ({ ...prev, options: newOptions }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewField((prev) => ({
                        ...prev,
                        options: [...(prev.options || []), `Tùy chọn ${(prev.options?.length || 0) + 1}`],
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tùy chọn
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={newField.required}
                onCheckedChange={(checked) =>
                  setNewField((prev) => ({ ...prev, required: checked }))
                }
              />
              <Label>Bắt buộc</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFieldDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddField}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Fields Dialog */}
      <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sắp xếp lại các trường</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">
                    {field.label}
                    {field.isDefault && (
                      <span className="text-xs text-muted-foreground ml-2">(Mặc định)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{fieldTypeLabels[field.type]}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveField(index, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveField(index, "down")}
                    disabled={index === fields.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Don't close reorder dialog when opening add field dialog
                  setIsAddFieldDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm trường mới
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReorderDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => setIsReorderDialogOpen(false)}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ConferenceLayout>
  );
};

export default FormManagement;

