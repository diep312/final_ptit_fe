import { useState } from "react";
import { Check, Pencil, Trash2, Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Room {
  id: string;
  name: string;
}

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoom?: string;
  onSelectRoom: (roomName: string) => void;
  onAddRoom: (roomName: string) => void;
  onEditRoom: (roomId: string, newName: string) => void;
  onDeleteRoom: (roomId: string) => void;
  disabled?: boolean;
}

export const RoomSelector = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  disabled = false,
}: RoomSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleStartEdit = (room: Room) => {
    setEditingId(room.id);
    setEditValue(room.name);
    setIsAddingNew(false);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      onEditRoom(editingId, editValue.trim());
      setEditingId(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setNewRoomName("");
  };

  const handleSaveNew = () => {
    if (newRoomName.trim()) {
      onAddRoom(newRoomName.trim());
      setIsAddingNew(false);
      setNewRoomName("");
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewRoomName("");
  };

  const handleDeleteClick = (room: Room) => {
    setDeleteConfirm({ id: room.id, name: room.name });
    setIsOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeleteRoom(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const selectedRoomObj = rooms.find((r) => r.name === selectedRoom);

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled} className="min-w-[200px] justify-between">
            <span>{selectedRoom || "Chọn phòng"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px] p-2">
          {/* Existing Rooms */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors"
              >
                {editingId === room.id ? (
                  <>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="flex-1 h-8"
                      autoFocus
                      placeholder="Tên phòng"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={handleSaveEdit}
                      disabled={!editValue.trim()}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      className="flex-1 text-left px-2 py-1 rounded hover:bg-muted/50"
                      onClick={() => {
                        onSelectRoom(room.name);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {selectedRoom === room.name && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        <span className={selectedRoom === room.name ? "font-medium" : ""}>
                          {room.name}
                        </span>
                      </div>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleStartEdit(room)}
                      disabled={disabled}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(room)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add New Room Section */}
          <div className="border-t mt-2 pt-2">
            {isAddingNew ? (
              <div className="flex items-center gap-2 px-2 py-2">
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNew();
                    if (e.key === "Escape") handleCancelAdd();
                  }}
                  className="flex-1 h-8"
                  autoFocus
                  placeholder="Tên phòng mới"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleSaveNew}
                  disabled={!newRoomName.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleCancelAdd}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleStartAdd}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm phòng mới
              </Button>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phòng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phòng <strong>"{deleteConfirm?.name}"</strong>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                Cảnh báo: Tất cả các phiên hội nghị trong phòng này sẽ bị xóa vĩnh viễn.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa phòng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
