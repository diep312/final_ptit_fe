import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ConferenceLayout } from "@/components/layout/ConferenceLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Filter } from "lucide-react";
import { useApi } from "@/hooks/use-api";

// Form field types
type FormFieldType = "text" | "email" | "multipleChoice" | "textarea" | "number" | "date";

type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  options?: string[]; // For multiple choice fields
};

// small helper for badge colors
const badgeColors = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-red-100 text-red-800 border-red-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];
const getBadgeColor = (i: number) => badgeColors[i % badgeColors.length];

const RegistrationList = () => {
  const { id } = useParams();
  const { api, safeRequest } = useApi();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [fields, setFields] = useState<FormField[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showColumns, setShowColumns] = useState({
    avatar: true,
    phone: true,
    dob: true,
    gender: true,
    address: true,
    bio: false,
    created_at: true,
  });

  // computed sizing
  const visibleCount = Object.values(showColumns).filter(Boolean).length;
  const baseCols = 3; // STT, Name, Email
  const totalCols = (fields.length || 0) + baseCols + visibleCount;
  const tableMinWidth = Math.max(700, totalCols * 180);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    safeRequest(async () => {
      // Get form fields
      const formRes: any = await api.get(`/organizer/events/forms/event/${id}`);
      let mappedFields: FormField[] = [];
      if (formRes && Array.isArray(formRes.fields)) {
        mappedFields = formRes.fields.map((f: any) => ({
          id: f._id,
          label: f.field_label || f._id,
          type: ((): FormFieldType => {
            const map: any = { TEXT: 'text', TEXTAREA: 'textarea', RADIO: 'multipleChoice', CHECKBOX: 'multipleChoice', EMAIL: 'email', NUMBER: 'number', DATE: 'date' };
            return map[f.field_type] || 'text';
          })(),
          options: f.field_options || []
        }));
      }
      setFields(mappedFields);

      // Get registrations
      const resAny: any = await api.get(`/organizer/events/${id}/registrations`);
      if (!resAny) return;
      const payload: any = resAny?.data ?? resAny;
      setRegistrations(payload?.registrations || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const filteredRegistrations = useMemo(() => {
    if (!searchQuery.trim()) return registrations;
    const q = searchQuery.toLowerCase();
    return registrations.filter((r: any) => {
      if (r.registration) {
        if (r.registration.full_name && r.registration.full_name.toLowerCase().includes(q)) return true;
        if (r.registration.email && r.registration.email.toLowerCase().includes(q)) return true;
      }
      if (r.responses) {
        for (const val of Object.values(r.responses)) {
          if (!val) continue;
          const s = Array.isArray(val) ? val.join(' ').toLowerCase() : String(val).toLowerCase();
          if (s.includes(q)) return true;
        }
      }
      return false;
    });
  }, [registrations, searchQuery]);

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filteredRegistrations.slice(startIndex, startIndex + itemsPerPage);

  const renderFieldValue = (field: FormField, value: any) => {
    if (value === undefined || value === null || value === "") return '-';
    if (field.type === 'multipleChoice') {
      const arr = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map((v, i) => (
            <Badge key={i} variant="outline" className={getBadgeColor(i)}>{v}</Badge>
          ))}
        </div>
      );
    }
    if (field.type === 'date') {
      try {
        return <span className="text-sm">{new Date(value).toLocaleDateString()}</span>;
      } catch {
        return <span className="text-sm">{String(value)}</span>;
      }
    }
    return <span className="text-sm">{String(value)}</span>;
  };

  const handlePageChange = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <ConferenceLayout>
      <div className="px-6 py-6 min-w-0">
        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-2">
            {/* <Button variant="outline" onClick={() => {}}>
              <Filter className="h-4 w-4 mr-2" /> Lọc
            </Button> */}
            <Input
              className="mx-auto flex-1 max-w-md"
              placeholder="Nhập tên cần tìm kiếm..."
              value={searchQuery}
              onChange={(e: any) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="rounded-lg border bg-white min-w-0 overflow-y-auto h-[580px] mx-auto" style={{ maxWidth: 'calc(100vw - 200px)' }}>
            {/* container scrolls horizontally and vertically; keeps fixed card size
                maxWidth subtracts sidebar+gutter so the card doesn't span the full viewport */}
            <div style={{ minWidth: tableMinWidth }} className="min-w-0 inline-block" >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="min-w-[60px] font-medium">STT</TableHead>
                    {fields.map(f => {
                      // Map field type to min-width
                      const typeWidthMap: Record<string, string> = {
                        NUMBER: 'min-w-[48px]',
                        CHECKBOX: 'min-w-[56px]',
                        TIME_MINUTE: 'min-w-[56px]',
                        FILE: 'min-w-[64px]',
                        PHONE: 'min-w-[72px]',
                        EMAIL: 'min-w-[88px]',
                        RADIO: 'min-w-[88px]',
                        DATE: 'min-w-[88px]',
                        TEXT: 'min-w-[64px]',
                        TEXTAREA: 'min-w-[120px]',
                        multipleChoice: 'min-w-[88px]',
                        text: 'min-w-[64px]',
                        textarea: 'min-w-[120px]',
                        number: 'min-w-[48px]',
                        email: 'min-w-[88px]',
                        date: 'min-w-[88px]',
                      };
                      const minWidth = typeWidthMap[f.type?.toUpperCase?.() || f.type] || 'min-w-[150px]';
                      return (
                        <TableHead key={f.id} className={`${minWidth} font-medium`}>{f.label}</TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length > 0 ? (
                    paginated.map((reg: any, idx: number) => (
                      <TableRow key={reg.registration_id || idx}>
                        <TableCell className="font-medium">{startIndex + idx + 1}</TableCell>
                        {fields.map(f => {
                          const typeWidthMap: Record<string, string> = {
                            NUMBER: 'min-w-[48px]',
                            CHECKBOX: 'min-w-[56px]',
                            TIME_MINUTE: 'min-w-[56px]',
                            FILE: 'min-w-[64px]',
                            PHONE: 'min-w-[72px]',
                            EMAIL: 'min-w-[88px]',
                            RADIO: 'min-w-[88px]',
                            DATE: 'min-w-[88px]',
                            TEXT: 'min-w-[64px]',
                            TEXTAREA: 'min-w-[120px]',
                            multipleChoice: 'min-w-[88px]',
                            text: 'min-w-[64px]',
                            textarea: 'min-w-[120px]',
                            number: 'min-w-[48px]',
                            email: 'min-w-[88px]',
                            date: 'min-w-[88px]',
                          };
                          const minWidth = typeWidthMap[f.type?.toUpperCase?.() || f.type] || 'min-w-[150px]';
                          return (
                            <TableCell key={f.id} className={minWidth}>{renderFieldValue(f, reg.responses ? reg.responses[f.id] : reg.registration ? reg.registration[f.id] : undefined)}</TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={totalCols} className="text-center text-muted-foreground">
                        <div className="flex items-center justify-center py-12 min-h-[580px] w-full">Không có dữ liệu</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 0 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e:any) => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
                    </PaginationItem>
                  )}

                  {(() => {
                    const pages: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (currentPage > 4) pages.push('ellipsis');
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      for (let i = start; i <= end; i++) if (i !== 1 && i !== totalPages) pages.push(i);
                      if (currentPage < totalPages - 3) pages.push('ellipsis');
                      if (totalPages > 1) pages.push(totalPages);
                    }
                    return pages.map((p, i) => p === 'ellipsis' ? (
                      <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                    ) : (
                      <PaginationItem key={p}><PaginationLink href="#" isActive={p === currentPage} onClick={(e:any) => { e.preventDefault(); if (p !== currentPage) handlePageChange(p as number); }}>{p}</PaginationLink></PaginationItem>
                    ));
                  })()}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e:any) => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </ConferenceLayout>
  );
};

export default RegistrationList;

