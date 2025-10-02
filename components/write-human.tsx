"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  HumanizerService,
  type JobStatus,
  type HumanizeResult,
} from "@/lib/services/humanizer.service";
import {
  Loader2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ThesaurusWord {
  word: string;
  synonyms: string[];
  position: number;
}

export function WriteHuman() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [thesaurus, setThesaurus] = useState<Record<string, string[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplit, setShowSplit] = useState(false);
  const currentJobIdRef = useRef<string | null>(null);

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to humanize");
      return;
    }

    if (inputText.length > 10000) {
      toast.error("Text must be less than 10,000 characters");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setShowSplit(true);
    setOutputText("");
    setThesaurus({});

    try {
      const job = await HumanizerService.submitJob(inputText, {
        includeThesaurus: true,
      });

      currentJobIdRef.current = job.jobId;
      toast.success("Job submitted! Processing...");

      const result = await HumanizerService.pollForResult(
        job.jobId,
        (status) => {
          setJobStatus(status);
          
          if (status.status === "waiting") {
            setProgress(10);
          } else if (status.status === "processing") {
            setProgress(50);
          }
        },
        2000
      );

      setProgress(100);
      setOutputText(result.data.text);
      setThesaurus(result.data.thesaurus || {});
      toast.success("Text humanized successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to humanize text";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      currentJobIdRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setThesaurus({});
    setShowSplit(false);
    setError(null);
    setProgress(0);
    setJobStatus(null);
  };

  const handleWordReplace = (originalWord: string, newWord: string) => {
    setOutputText((prev) => {
      const regex = new RegExp(`\\b${originalWord}\\b`, "gi");
      return prev.replace(regex, newWord);
    });
    toast.success(`Replaced "${originalWord}" with "${newWord}"`);
  };

  const renderOutputWithThesaurus = () => {
    if (!outputText) return null;

    const words = outputText.split(/(\s+)/);
    const thesaurusKeys = Object.keys(thesaurus);

    return (
      <div className="whitespace-pre-wrap break-words">
        {words.map((word, index) => {
          const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();
          const hasThesaurus = thesaurusKeys.some(
            (key) => key.toLowerCase() === cleanWord
          );

          if (hasThesaurus && word.trim()) {
            const synonyms =
              thesaurus[
                thesaurusKeys.find((key) => key.toLowerCase() === cleanWord)!
              ];

            return (
              <DropdownMenu key={index}>
                <DropdownMenuTrigger asChild>
                  <span className="relative inline-flex items-center cursor-pointer group">
                    <span className="underline decoration-blue-400 decoration-dotted underline-offset-2 hover:decoration-solid hover:decoration-blue-600 transition-colors">
                      {word}
                    </span>
                    <ChevronDown className="w-3 h-3 ml-0.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-w-xs">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                    Synonyms
                  </div>
                  {synonyms?.slice(0, 8).map((synonym, synIndex) => (
                    <DropdownMenuItem
                      key={synIndex}
                      onClick={() =>
                        handleWordReplace(word.trim(), synonym)
                      }
                      className="cursor-pointer"
                    >
                      {synonym}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return <span key={index}>{word}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Write Human</h2>
          <p className="text-gray-600 mt-1">
            Transform AI-generated text into natural, human-like content
          </p>
        </div>
        {showSplit && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isProcessing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Text
          </Button>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    {jobStatus?.status === "waiting" && "Queued..."}
                    {jobStatus?.status === "processing" && "Processing..."}
                    {!jobStatus && "Submitting..."}
                  </span>
                  <span className="text-xs text-blue-700">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                {jobStatus?.status === "waiting" && jobStatus.position && (
                  <p className="text-xs text-blue-600 mt-1">
                    Position in queue: {jobStatus.position}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">
                  Processing Failed
                </h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input/Output Split View */}
      <div
        className={`grid gap-6 ${showSplit ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Input Section */}
        <Card className={showSplit ? "" : "max-w-4xl mx-auto"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Input Text</CardTitle>
              <Badge variant="outline">
                {inputText.length} / 10,000 characters
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your AI-generated text here to make it more human-like..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[300px] resize-none font-mono text-sm"
              disabled={isProcessing}
            />
            <Button
              className="w-full mt-4"
              onClick={handleSubmit}
              disabled={isProcessing || !inputText.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                showSplit ? "Reprocess" : "Humanize Text"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        {showSplit && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Humanized Output</CardTitle>
                <div className="flex items-center space-x-2">
                  {Object.keys(thesaurus).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Click words for synonyms
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!outputText}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[300px] p-4 bg-gray-50 rounded-md border text-sm">
                {outputText ? (
                  renderOutputWithThesaurus()
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    {isProcessing
                      ? "Processing your text..."
                      : "Humanized text will appear here"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-purple-900 mb-2">How it works</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Paste your AI-generated text in the input box</li>
            <li>• Click "Humanize Text" to transform it</li>
            <li>
              • Click on underlined words in the output to see synonym options
            </li>
            <li>• Copy the final result with the copy button</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
