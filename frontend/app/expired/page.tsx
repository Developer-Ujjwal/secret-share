"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle } from "lucide-react"

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Shield className="inline-block w-8 h-8 mr-2 text-blue-600" />
            SecretShare
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-600 text-center">
              <Shield className="inline-block w-5 h-5 mr-2" />
              Secret Destroyed
            </CardTitle>
            <CardDescription className="text-center">
              This secret has been permanently destroyed and cannot be recovered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🔥</div>
              <p className="text-gray-600 mb-8">
                The secret has self-destructed for your security. All traces have been permanently removed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Encrypted data deleted from server</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Temporary files cleared from memory</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Blob URLs revoked</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>View session terminated</span>
                </div>
              </div>
              <Button onClick={() => (window.location.href = "/")} size="lg" className="px-8">
                Create New Secret
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Your security is our priority. Secrets are designed to leave no trace.</p>
        </div>
      </div>
    </div>
  )
}
