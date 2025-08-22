'use client'

import { AppLayout } from '@/components/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  Code,
  ExternalLink,
  Key,
  Webhook
} from 'lucide-react'

export default function IntegrationsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Integrations
          </h1>
          <div className="epigraph text-muted-foreground max-w-2xl mx-auto">
            &ldquo;The artist, like the God of creation, remains within or behind or beyond or above his handiwork, invisible, refined out of existence, indifferent, paring his fingernails.&rdquo;
            <div className="text-sm mt-2 opacity-75">— James Joyce, A Portrait of the Artist as a Young Man</div>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Access */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>API Access</CardTitle>
                </div>
                <Badge variant="outline">Available</Badge>
              </div>
              <CardDescription>
                Programmatic access to Joyce&apos;s transcription capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Integrate Joyce directly into your applications with our RESTful API. 
                Perfect for developers who want to embed voice-to-text capabilities.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Code className="mr-2 h-4 w-4" />
                  View Documentation
                </Button>
                <Button size="sm">
                  Generate API Key
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Obsidian Plugin */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>Obsidian Plugin</CardTitle>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardDescription>
                Native voice recording and transcription within Obsidian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Record voice notes directly in your Obsidian vault and have them 
                instantly transcribed and formatted as markdown notes.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Plugin Store
                </Button>
                <Button size="sm" variant="outline">
                  Join Waitlist
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Webhook className="h-5 w-5 text-primary" />
                  <CardTitle>Webhooks</CardTitle>
                </div>
                <Badge variant="outline">Available</Badge>
              </div>
              <CardDescription>
                Real-time notifications for transcription events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Receive instant notifications when transcriptions are completed, 
                failed, or when summaries are generated.
              </p>
              <div className="flex gap-2">
                <Button size="sm">
                  Configure Webhooks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Literary Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground italic">
            &ldquo;The end of all our exploring will be to arrive where we started and know the place for the first time.&rdquo;
          </p>
          <p className="text-xs text-muted-foreground mt-2">— T.S. Eliot</p>
        </div>
      </div>
    </AppLayout>
  )
}