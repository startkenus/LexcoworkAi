'use client';

import { useState } from 'react';
import { useClaudeAPI } from '@/hooks/use-claude-api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, RotateCcw } from 'lucide-react';

export function ClaudeTest() {
  const [userMessage, setUserMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful legal AI assistant for LexCoworkAI.'
  );

  const { callAPI, loading, result, error, reset } = useClaudeAPI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userMessage.trim()) {
      return;
    }

    await callAPI(userMessage, systemPrompt);
  };

  const handleReset = () => {
    setUserMessage('');
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Claude API Test</CardTitle>
            <CardDescription className="text-gray-300">
              Test the Anthropic Claude API integration. Send a message to Claude and see the
              response.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system-prompt" className="text-gray-200">System Prompt (Optional)</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="Enter system prompt..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="resize-none bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-message" className="text-gray-200">User Message *</Label>
                <Textarea
                  id="user-message"
                  placeholder="Enter your message to Claude..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  rows={5}
                  className="resize-none bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !userMessage.trim()} className="flex-1 bg-white text-black hover:bg-gray-200">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to Claude
                    </>
                  )}
                </Button>

                <Button type="button" variant="outline" onClick={handleReset} disabled={loading} className="border-gray-500 text-white hover:bg-white/10">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 backdrop-blur-sm">
            <AlertDescription className="text-gray-100">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Claude Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg whitespace-pre-wrap text-gray-100">
                {result}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">API Configuration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-200">
                API Key: {process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Note: Make sure to add your Anthropic API key to the .env file as
              NEXT_PUBLIC_ANTHROPIC_API_KEY
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
