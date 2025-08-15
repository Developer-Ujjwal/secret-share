"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Eye, Shield, Timer, AlertCircle } from "lucide-react";
import "./security.css";
import { toast } from "sonner";
export default function ViewSecretPage() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [secret, setSecret] = useState<any>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptedFile, setDecryptedFile] = useState<{
    url: string;
    filename: string;
    type: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [devToolsDetected, setDevToolsDetected] = useState(false);
  const toastShown = useRef(false);
  const leavePage = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const importKey = async (keyHex: string): Promise<CryptoKey> => {
    const keyBytes = new Uint8Array(
      keyHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16))
    );
    return await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"]
    );
  };

  const decryptData = async (
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ) => {
    return await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );
  };

  const startDestructTimer = (durationInSeconds: number) => {
    setTimeLeft(durationInSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (decryptedFile) {
            URL.revokeObjectURL(decryptedFile.url);
          }
          window.location.href = "/expired";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      if (decryptedFile) {
        URL.revokeObjectURL(decryptedFile.url);
      }
      window.location.href = "/expired";
    }, durationInSeconds * 1000);
  };

  const fetchAndDecryptSecret = async () => {
    if (devToolsDetected) {
      alert(
        "Please close developer tools to continue viewing this secure content."
      );
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const secretId = params.id as string;
      const keyHex = window.location.hash.substring(1);

      if (!keyHex) {
        throw new Error("Encryption key not found in URL");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/secrets/${secretId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Secret not found or has already been viewed");
        }
        throw new Error("Failed to fetch secret");
      }

      const secretData = await response.json();
      setSecret(secretData);

      const key = await importKey(keyHex);
      const encryptedBytes = Uint8Array.from(
        atob(secretData.encrypted_data),
        (c) => c.charCodeAt(0)
      ).buffer;
      const iv = Uint8Array.from(atob(secretData.iv), (c) => c.charCodeAt(0));

      const decrypted = await decryptData(encryptedBytes, key, iv);

      if (secretData.content_type === "text/plain") {
        const text = new TextDecoder().decode(decrypted);
        setDecryptedContent(text);
      } else {
        const blob = new Blob([decrypted], { type: secretData.content_type });
        const url = URL.createObjectURL(blob);
        setDecryptedFile({
          url,
          filename: secretData.filename || "downloaded-file",
          type: secretData.content_type,
        });
      }

      setIsViewing(true);
      startDestructTimer(secretData.expires_in);

      toast.success("Secret decrypted successfully",{description:`The secret will self-destruct in ${secretData.expires_in} seconds`});
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to decrypt secret"
      );
      toast.error("Error",{
        description:
          error instanceof Error ? error.message : "Failed to decrypt secret",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDevTools = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    if (widthThreshold || heightThreshold) {
      setDevToolsDetected(true);
      if (!toastShown.current) {
        toast.error("Please close developer tools to continue viewing this secure content.", { duration: 5000 });
        toastShown.current = true;
      }
    } else {
      setDevToolsDetected(false);
      toastShown.current = false;
    }
  };

  useEffect(() => {
    checkDevTools();
    let devToolsCheckInterval: NodeJS.Timeout;

    const detectDevTools = () => {
      checkDevTools();
    };

    devToolsCheckInterval = setInterval(detectDevTools, 500);

    if (!isViewing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "S")) ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "i" || e.key === "j" || e.key === "c" || e.key === "s")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
        (e.ctrlKey && (e.key === "s" || e.key === "S")) ||
        (e.ctrlKey && (e.key === "a" || e.key === "A")) ||
        (e.ctrlKey && (e.key === "c" || e.key === "C")) ||
        (e.ctrlKey && (e.key === "v" || e.key === "V")) ||
        (e.ctrlKey && (e.key === "x" || e.key === "X")) ||
        (e.ctrlKey && (e.key === "p" || e.key === "P")) ||
        e.key === "PrintScreen" ||
        (e.metaKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "S")) ||
        (e.metaKey &&
          e.shiftKey &&
          (e.key === "i" || e.key === "j" || e.key === "s" || e.key === "s")) ||
        (e.metaKey && (e.key === "u" || e.key === "U")) ||
        (e.metaKey && (e.key === "s" || e.key === "S")) ||
        (e.metaKey && (e.key === "a" || e.key === "A")) ||
        (e.metaKey && (e.key === "c" || e.key === "C")) ||
        (e.metaKey && (e.key === "v" || e.key === "V")) ||
        (e.metaKey && (e.key === "x" || e.key === "X")) ||
        (e.metaKey && (e.key === "p" || e.key === "P"))
      ) {
        alert("Keyboard shortcuts are not allowed for security reasons.");
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("");
        alert("Screenshots are not allowed for security reasons.");
        window.location.href = "/expired";
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!leavePage.current) {
          alert("Don't leave the page!");
          leavePage.current = true;
        }
        setTimeout(() => {
          if (document.hidden) {
            window.location.href = "/expired";
          }
          leavePage.current = false;
        }, 2000);
      }
    };

    const handleBlur = () => {
      if (!document.hasFocus()) {
        if (!leavePage.current) {
          leavePage.current = true;
          alert("Don't leave the page!");
        }
        setTimeout(() => {
          if (!document.hasFocus()) {
            window.location.href = "/expired";
          }
          leavePage.current = false;
        }, 3000);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("selectstart", handleSelectStart, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCopy, true);
    document.addEventListener("paste", handleCopy, true);
    document.addEventListener("visibilitychange", handleVisibilityChange, true);
    window.addEventListener("blur", handleBlur, true);

    console.clear();
    console.log(
      "%cSTOP!",
      "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"
    );
    console.log(
      "%cThis is a browser feature intended for developers. Unauthorized access to this content is prohibited.",
      "color: red; font-size: 16px;"
    );

    const consoleClearInterval = setInterval(() => {
      console.clear();
    }, 1000);

    return () => {
      clearInterval(devToolsCheckInterval);
      clearInterval(consoleClearInterval);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("selectstart", handleSelectStart, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCopy, true);
      document.removeEventListener("paste", handleCopy, true);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
        true
      );
      window.removeEventListener("blur", handleBlur, true);
    };
  }, [isViewing]);

  const canDisplayInIframe = (contentType: string) => {
    const iframeSupported = [
      "application/pdf",
      "text/html",
      "text/plain",
      "text/css",
      "text/javascript",
      "application/json",
      "text/xml",
      "application/xml",
      "image/svg+xml",
    ];

    return (
      iframeSupported.some((type) => contentType.includes(type)) ||
      contentType.startsWith("image/") ||
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/")
    );
  };

  const renderContent = () => {
    if (decryptedContent) {
      return (
        <div
          className="p-4 bg-gray-50 h-full select-none min-h-[400px]"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          <pre
            className="whitespace-pre-wrap break-words text-sm font-mono select-none"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
          >
            {decryptedContent}
          </pre>
        </div>
      );
    }

    if (decryptedFile) {
      if (canDisplayInIframe(decryptedFile.type)) {
        return (
          <div className="relative w-full min-h-96 bg-gray-100 rounded-lg overflow-auto">
            <object
              data={`${decryptedFile.url}#toolbar=0`}
              type={decryptedFile.type}
              className="secure-content w-full min-h-96 object-contain"
              aria-label={`Secure view of ${decryptedFile.filename}`}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="p-8 text-center bg-gray-50 relative min-h-[400px] flex flex-col justify-center">
                <p className="font-medium text-lg mb-2">
                  Preview not available
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Your browser does not support inline previews for this file
                  type.
                </p>
              </div>
            </object>

            <div
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                background: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 100px,
                    rgba(255,0,0,0.1) 100px,
                    rgba(255,0,0,0.1) 102px
                  )
                `,
              }}
            />
          </div>
        );
      } else {
        return renderFileMetadata();
      }
    }

    return null;
  };

  const renderFileMetadata = () => {
    if (!decryptedFile) return null;

    const getFileIcon = (type: string) => {
      if (type.includes("pdf")) return "📄";
      if (type.includes("word") || type.includes("doc")) return "📝";
      if (type.includes("excel") || type.includes("sheet")) return "📊";
      if (type.includes("powerpoint") || type.includes("presentation"))
        return "📽️";
      if (
        type.includes("zip") ||
        type.includes("rar") ||
        type.includes("archive")
      )
        return "🗜️";
      if (type.includes("audio")) return "🎵";
      if (type.includes("video")) return "🎬";
      return "📁";
    };

    return (
      <div className="p-8 text-center bg-gray-50 relative min-h-[400px] flex flex-col justify-center">
        <div className="text-6xl mb-4">{getFileIcon(decryptedFile.type)}</div>
        <p className="font-medium text-lg mb-2">{decryptedFile.filename}</p>
        <p className="text-sm text-gray-600 mb-4">
          {decryptedFile.type}{" "}
          {secret?.file_size &&
            `• ${(secret.file_size / 1024 / 1024).toFixed(2)} MB`}
        </p>
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4 max-w-md mx-auto">
          ⚠️ This file type cannot be displayed inline for security reasons, but
          the content has been successfully decrypted.
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="max-w-2xl mx-auto pt-16">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">
                <AlertTriangle className="inline-block w-5 h-5 mr-2" />
                Secret Not Found
              </CardTitle>
              <CardDescription>
                This secret may have already been viewed, expired, or the link
                is invalid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => (window.location.href = "/")}>
                Create New Secret
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Shield className="inline-block w-8 h-8 mr-2 text-blue-600" />
            SecretShare
          </h1>
          <p className="text-gray-600">Secure secret viewing</p>
        </div>

        {devToolsDetected && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Developer Tools Detected
                  </p>
                  <p className="text-sm text-orange-700">
                    Please close developer tools to continue viewing this secure
                    content.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isViewing ? (
          <Card>
            <CardHeader>
              <CardTitle>View Secret</CardTitle>
              <CardDescription>
                Click below to decrypt and view this one-time secret.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Eye className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600 mb-6">
                  ⚠️ Warning: This secret can only be viewed once and will
                  self-destruct after few seconds.
                </p>
                <Button
                  onClick={fetchAndDecryptSecret}
                  disabled={isLoading || devToolsDetected}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      View Secret
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="relative">
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 50px,
                    rgba(255,0,0,0.005) 50px,
                    rgba(255,0,0,0.005) 52px
                  ),
                  repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 50px,
                    rgba(0,0,255,0.005) 50px,
                    rgba(0,0,255,0.005) 52px
                  )
                `,
              }}
            />

            <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-20 text-xs text-red-600 font-mono transform rotate-12">
              CONFIDENTIAL • VIEW ONCE
            </div>
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none opacity-20 text-xs text-red-600 font-mono transform -rotate-12">
              NO SCREENSHOTS
            </div>
            <div className="absolute top-1/2 left-1/2 z-20 pointer-events-none opacity-10 text-xs text-red-600 font-mono transform -translate-x-1/2 -translate-y-1/2 rotate-45">
              PROTECTED CONTENT
            </div>

            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Secret Content</span>
                <div className="flex items-center text-sm text-orange-600">
                  <Timer className="w-4 h-4 mr-1" />
                  {timeLeft}s remaining
                </div>
              </CardTitle>
              <CardDescription>
                This secret is now visible. It will self-destruct in {timeLeft}{" "}
                seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress
                value={(timeLeft / (secret?.expires_in || 1)) * 100}
                className="w-full"
              />

              <div
                ref={contentRef}
                className="relative border rounded-lg overflow-hidden"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                }}
              >
                {renderContent()}
              </div>

              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                🚫 <strong>Security Notice:</strong> Screenshots, copying, dev
                tools, and downloads are disabled. This content will be
                permanently destroyed in {timeLeft} seconds.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
