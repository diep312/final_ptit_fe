import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds

const CheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoElementRef = useRef<HTMLDivElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Conference data - in real app, fetch from API using id
  const conferenceTitle = "Hội nghị Công nghệ Số Việt Nam 2025";
  const { api, safeRequest } = useApi();

  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (isScanning && !isWaiting) {
      inactivityTimerRef.current = setTimeout(() => {
        stopScanning();
        setIsWaiting(true);
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    if (!isScanning || isWaiting) return;

    // Track user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isScanning, isWaiting]);

  const startScanning = async () => {
    try {
      setError(null);
      
      if (!videoElementRef.current) {
        throw new Error("Video element not found");
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment", // Use back camera
        },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgePercentage = 0.7; // Use 70% of the smaller edge
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code scanned successfully
          handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Scanning error (usually just no QR code in view)
          // We can ignore these errors as they're normal during scanning
        }
      );

      setIsScanning(true);
      setIsWaiting(false);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera của bạn."
      );
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    console.log("QR Code scanned:", qrCode);

    // Reset inactivity timer when QR code is scanned
    resetInactivityTimer();

    // Stop scanning temporarily to process the QR code
    await stopScanning();

    try {
      // Extract registration id from scanned content
      const scanned = (qrCode || "").trim();

      const extractRegistrationId = (text: string) => {
        if (!text) return null;
        // UUID v4 pattern
        const uuid = text.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
        if (uuid) return uuid[0];
        // Mongo ObjectId (24 hex)
        const objId = text.match(/[0-9a-fA-F]{24}/);
        if (objId) return objId[0];
        // If it's a URL, use last path segment
        try {
          const u = new URL(text);
          const parts = u.pathname.split('/').filter(Boolean);
          if (parts.length) return parts[parts.length - 1];
        } catch (e) {
          // not a url
        }
        // Fallback: if the scanned string is short-ish, treat it as an id
        if (text.length > 3 && text.length < 100) return text;
        return null;
      };

  const registrationId = extractRegistrationId(scanned);
      if (!registrationId) {
        toast({ title: 'QR không hợp lệ', description: 'Không tìm thấy mã đăng ký trong QR.' });
        setTimeout(() => startScanning(), 1000);
        return;
      }

      // Call organizer check-in endpoint
      const payload = { event_id: id, registration_id: registrationId };
      const res = await safeRequest(() => api.post('/organizer/checkins', payload));

      if (!res) {
        // safeRequest already shows error via feedback provider. Restart scanning.
        setTimeout(() => startScanning(), 1000);
        return;
      }

      const msg = (res as any)?.message ?? 'Check-in thành công.';
      toast({ title: 'Check-in', description: String(msg) });

      // Restart scanning after a short pause so operator can see feedback
      setTimeout(() => startScanning(), 1000);
    } catch (err) {
      console.error("Error processing QR code:", err);
      toast({ title: 'Lỗi', description: (err as Error)?.message ?? 'Lỗi khi xử lý QR' });
      // Restart scanning even if there's an error
      setTimeout(() => startScanning(), 1000);
    }
  };

  const handleStartCheckIn = () => {
    setIsWaiting(false);
    startScanning();
  };

  useEffect(() => {
    // Enter fullscreen when component mounts
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
      } catch (err) {
        console.error("Error entering fullscreen:", err);
      }
    };

    enterFullscreen();
    startScanning();

    // Cleanup on unmount
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      stopScanning();
      
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    };
  }, []);

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex gap-6 items-center">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover"/>
          </div>
          <h1 className='font-heading font-bold text-3xl text-foreground'>Conferdent</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
        {isWaiting ? (
          // Waiting Screen
          <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg p-6 md:p-12 max-h-full overflow-y-auto">
            <div className="text-center space-y-8">
              <h1 className="text-3xl md:text-4xl font-heading text-gray-900">
                Chào mừng bạn đến với
              </h1>
              <h2 className="text-4xl md:text-5xl font-heading text-gray-900 mb-8">
                {conferenceTitle}
              </h2>

              {/* Illustration placeholder */}
              <div className="flex justify-center my-12">
                <div className="bg-blue-50 rounded-2xl p-8 max-w-2xl w-full">
                  <div className="relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-12">
                    {/* Simple illustration representation */}
                    <div className="flex items-center justify-center space-x-8">
                      <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        👤
                      </div>
                      <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                      <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        👩
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
                <p className="text-lg text-gray-700">
                  Vui lòng làm thủ tục check-in để tiếp tục
                </p>
              </div>

              <Button
                onClick={handleStartCheckIn}
                size="lg"
                className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-6 text-lg rounded-full flex items-center gap-3 mx-auto"
              >
                <QrCode className="w-5 h-5" />
                Check-in ngay
              </Button>
            </div>
          </div>
        ) : (
          // Scanning Screen
          <div className="w-full max-w-4xl space-y-4 md:space-y-6 flex flex-col items-center">
            <div className="text-center space-y-1 md:space-y-2">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-gray-700">
                Chào mừng bạn đến với
              </h1>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading text-gray-900 px-4">
                {conferenceTitle}
              </h2>
            </div>

            {/* QR Scanner Container */}
            <div className="relative bg-gray-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md aspect-square">
              {/* Phone frame effect */}
              <div className="absolute inset-x-0 top-0 h-8 md:h-12 bg-gray-800 z-10" />
              <div className="absolute inset-x-0 bottom-0 h-8 md:h-12 bg-gray-800 z-10" />
              
              <div
                id="qr-reader"
                ref={videoElementRef}
                className="w-full h-full aspect-square relative bg-black"
              >
                {/* Scanner will be injected here by html5-qrcode */}
              </div>

              {/* Overlay with corner indicators */}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-800">{error}</p>
                <Button
                  onClick={startScanning}
                  className="mt-4"
                  variant="outline"
                >
                  Thử lại
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;

