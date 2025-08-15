"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Shield,
  Copy,
  CheckCircle,
  Lock,
  Timer,
  Eye,
  FileText,
  ImageIcon,
  Video,
  Archive,
  Zap,
  Globe,
  Users,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [expiresIn, setExpiresIn] = useState(30);

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "End-to-End Encryption",
      description:
        "Your data is encrypted client-side with AES-256 before leaving your device",
      detail: "Military-grade encryption ensures your secrets remain private",
    },
    {
      icon: <Timer className="w-8 h-8 text-orange-600" />,
      title: "Self-Destruct Timer",
      description: "Secrets automatically destroy after a set viewing duration",
      detail: "No traces left behind - complete data destruction guaranteed",
    },
    {
      icon: <Eye className="w-8 h-8 text-green-600" />,
      title: "One-Time Viewing",
      description:
        "Each secret can only be viewed once, then it's gone forever",
      detail: "Perfect for sharing sensitive information securely",
    },
    {
      icon: <Globe className="w-8 h-8 text-purple-600" />,
      title: "Universal File Support",
      description: "Share any file type - documents, images, videos, archives",
      detail: "Advanced iframe viewing with comprehensive security",
    },
  ];

  const supportedTypes = [
    {
      icon: <FileText className="w-6 h-6" />,
      name: "Documents",
      types: "PDF, DOC, TXT, RTF",
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      name: "Images",
      types: "PNG, JPG, GIF, SVG",
    },
    {
      icon: <Video className="w-6 h-6" />,
      name: "Videos",
      types: "MP4, AVI, MOV, WebM",
    },
    {
      icon: <Archive className="w-6 h-6" />,
      name: "Archives",
      types: "ZIP, RAR, 7Z",
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, features.length]);

  const generateKey = async (): Promise<CryptoKey> => {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  };

  const encryptData = async (data: ArrayBuffer, key: CryptoKey) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );
    return { encrypted, iv };
  };

  const exportKey = async (key: CryptoKey): Promise<string> => {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return Array.from(new Uint8Array(exported))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEncrypting(true);

    try {
      let dataToEncrypt: ArrayBuffer;
      let filename: string | null = null;
      let contentType: string | null = null;
      let fileSize: number | null = null;

      if (file) {
        dataToEncrypt = await file.arrayBuffer();
        filename = file.name;
        contentType = file.type;
        fileSize = file.size;
      } else if (message) {
        // @ts-ignore
        dataToEncrypt = new TextEncoder().encode(message);
        contentType = "text/plain";
      } else {
        toast.error("Please enter a message or select a file");
        return;
      }

      const key = await generateKey();
      const { encrypted, iv } = await encryptData(dataToEncrypt, key);

      const encryptedB64 = arrayBufferToBase64(encrypted);
      const ivB64 = arrayBufferToBase64(iv.buffer);

      const keyHex = await exportKey(key);

      const formData = new FormData();
      formData.append("encrypted_data", encryptedB64);
      formData.append("iv", ivB64);
      if (filename) formData.append("filename", filename);
      if (contentType) formData.append("content_type", contentType);
      if (fileSize) formData.append("file_size", fileSize.toString());
      formData.append("expires_in", expiresIn.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/secrets`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create secret");
      }

      const result = await response.json();
      const link = `${window.location.origin}/view/${result.id}#${keyHex}`;
      setShareLink(link);

      toast.success("Success",{description:"Secret encrypted and ready to share!"});
    } catch (error) {
      toast.error("Failed to encrypt and upload secret");
    } finally {
      setIsEncrypting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.info("Copied!", { description: "Share link copied to clipboard" });
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-6">
            <img 
              src="/fullSecretForm.png" 
              className="w-40 h-20 object-contain"
              alt="SecretShare Logo"
            />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 pt-8">
          <div className="text-center mb-16">
            {/* <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-6">
              <Shield className="w-12 h-12 text-blue-600" />
            </div> */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Share Secrets
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Securely
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              End-to-end encrypted, one-time secret sharing with self-destruct
              capabilities. Your data is encrypted client-side and never stored
              unencrypted on our servers.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <Lock className="w-4 h-4 mr-2" />
                AES-256 Encryption
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Timer className="w-4 h-4 mr-2" />
                Self-Destruct Timer
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Eye className="w-4 h-4 mr-2" />
                One-Time View
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Instant Sharing
              </Badge>
            </div>
          </div>
            <div className="max-w-2xl mx-auto px-4 pb-16">
          {!shareLink ? (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create a Secret</CardTitle>
              <CardDescription>
                Your message or file will be encrypted client-side and can only
                be viewed once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="message" className="text-base font-medium">
                    Secret Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your secret message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    disabled={!!file}
                    className="mt-2"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">OR</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="file" className="text-base font-medium">
                    Upload File
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      setFile(selectedFile || null);
                      if (selectedFile) setMessage("");
                    }}
                    disabled={!!message}
                    className="mt-2"
                  />
                  {file && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Selected: {file.name}
                      </p>
                      <p className="text-xs text-blue-700">
                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB • Type:{" "}
                        {file.type || "Unknown"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="expiresIn" className="text-base font-medium">
                    Self-Destruct Timer
                  </Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="expiresIn"
                      min={10}
                      max={300}
                      step={10}
                      value={[expiresIn]}
                      onValueChange={(value) => setExpiresIn(value[0])}
                    />
                    <Badge variant="secondary" className="w-24 justify-center">
                      {expiresIn} seconds
                    </Badge>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isEncrypting || (!message && !file)}
                >
                  {isEncrypting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                      Encrypting & Creating Link...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-3" />
                      Encrypt & Create Share Link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-600">
                <CheckCircle className="inline-block w-6 h-6 mr-2" />
                Secret Created Successfully!
              </CardTitle>
              <CardDescription>
                Share this link with your recipient. It can only be viewed once
                and will self-destruct.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm font-mono break-all text-gray-700">
                  {shareLink}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={copyToClipboard} className="flex-1 h-12">
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShareLink("");
                    setMessage("");
                    setFile(null);
                  }}
                  className="h-12"
                >
                  Create Another
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Timer className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Important Security Notice
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      This link will only work once. After viewing, the secret
                      will be permanently destroyed and cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

          <div className="max-w-4xl mx-auto mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isPlaying ? "Pause" : "Play"}
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1 space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                      currentFeature === index
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setCurrentFeature(index);
                      setIsPlaying(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {feature.icon}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl p-8 shadow-lg border min-h-full flex flex-col justify-center">
                <div className="text-center">
                  <div className="mb-6 inline-block">
                    {features[currentFeature].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {features[currentFeature].detail}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: isPlaying ? "100%" : "0%",
                        transitionDuration: isPlaying ? "4s" : "0.3s",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Universal File Support
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {supportedTypes.map((type, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4 text-blue-600">
                      {type.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {type.name}
                    </h3>
                    <p className="text-sm text-gray-600">{type.types}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">

        <div className="mt-12 text-center">
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4">
              <Shield className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Client-Side Encryption
              </h3>
              <p className="text-sm text-gray-600">
                All encryption happens in your browser. We never see your
                unencrypted data.
              </p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Users className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Zero Knowledge
              </h3>
              <p className="text-sm text-gray-600">
                Our servers never have access to your encryption keys or
                unencrypted content.
              </p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Globe className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Open Source</h3>
              <p className="text-sm text-gray-600">
                Transparent, auditable code ensures trust and security for all
                users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
