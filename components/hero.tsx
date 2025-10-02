"use client";

import React, { useState, useRef, useEffect } from "react";
import { ClipboardPaste, ImagePlus, Loader2, Copy, Download } from "lucide-react";
import { Button } from "./ui/button";
import { CustomSwitch } from "./ui/custom-switch";
import { HumanizerService, type JobStatus } from "@/lib/services/humanizer.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Hero() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [enhancedModel, setEnhancedModel] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [output, setOutput] = useState("");
  const [thesaurus, setThesaurus] = useState<Record<string, string[]>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);

  // Calculate word count
  const calculateWordCount = (text: string) => {
    const cleanText = text
      .trim()
      .replace(/[\r\n]+/g, " ")
      .replace(/[.,!?;:()[\]{}'"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleanText === "" ? 0 : cleanText.split(" ").length;
  };

  const wordCount = calculateWordCount(text);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (isDropdownOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDropdownOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && text.trim()) {
        e.preventDefault();
        handleWriteHuman();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [text]);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
    }
  };

  const handleTrySample = () => {
    const sampleText =
      "Artificial intelligence has become an integral part of modern technology, revolutionizing various industries and transforming the way we interact with digital systems. From machine learning algorithms to natural language processing, AI continues to evolve and reshape our world.";
    setText(sampleText);
  };

  const handleTextareaFocus = () => {
    setIsTextareaFocused(true);
  };

  const handleTextareaBlur = () => {
    setIsTextareaFocused(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleEnhancedModelToggle = () => {
    const isLoggedIn = false;

    if (!isLoggedIn) {
      setShowEnhancedModal(true);
    } else {
      setEnhancedModel(!enhancedModel);
    }
  };

  const handleClear = () => {
    setText("");
    setOutput("");
    setThesaurus({});
    setIsSplit(false);
  };

  const handleWriteHuman = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text first.");
      return;
    }

    if (text.length > 10000) {
      toast.error("Text must be less than 10,000 characters");
      return;
    }

    setIsProcessing(true);
    setIsSplit(true);
    setOutput("");
    setThesaurus({});

    try {
      const job = await HumanizerService.submitJob(text, {
        includeThesaurus: true,
      });

      const result = await HumanizerService.pollForResult(
        job.jobId,
        (status: JobStatus) => {
          if (status.status === "waiting" && status.position) {
            toast.info(`Position in queue: ${status.position}`);
          }
        },
        2000
      );

      setOutput(result.data.text);
      setThesaurus(result.data.thesaurus || {});
      toast.success("Text humanized successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not generate output. Please try again.";
      toast.error(errorMessage);
      setIsSplit(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  const handleDownloadOutput = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "humanized-text.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const handleWordReplace = (originalWord: string, newWord: string) => {
    setOutput((prev) => {
      const regex = new RegExp(`\\b${originalWord}\\b`, "i");
      return prev.replace(regex, newWord);
    });
    toast.success(`Replaced "${originalWord}" with "${newWord}"`);
  };

  const renderOutputWithThesaurus = () => {
    if (!output) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
          Output will appear here.
        </div>
      );
    }

    const words = output.split(/(\s+)/);
    const thesaurusKeys = Object.keys(thesaurus);

    return (
      <div className="whitespace-pre-wrap break-words leading-7 text-left">
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
              <DropdownMenu key={index} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <span className="cursor-pointer underline decoration-blue-400 decoration-dotted underline-offset-2 hover:decoration-solid hover:decoration-blue-600 hover:bg-blue-50 transition-all rounded px-0.5 inline-block">
                    {word}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-w-xs bg-white border border-slate-200 shadow-lg z-50" sideOffset={4}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-slate-50 border-b border-slate-200">
                    Synonyms
                  </div>
                  <div className="py-1">
                    {synonyms?.slice(0, 8).map((synonym, synIndex) => (
                      <DropdownMenuItem
                        key={synIndex}
                        onClick={() => handleWordReplace(word.trim(), synonym)}
                        className="cursor-pointer px-3 py-2 hover:bg-slate-50 focus:bg-slate-50 text-slate-900"
                      >
                        {synonym}
                      </DropdownMenuItem>
                    ))}
                  </div>
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
    <section className="relative overflow-hidden min-h-screen flex items-center pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8f7ff] via-[#fcf9ff] to-[#fdf2ff]">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute inset-0 bg-hero-radial opacity-70">
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="blob-top-left opacity-30" />
          <div className="blob-bottom-right opacity-30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f7ff]/50 via-[#fcf9ff]/70 to-[#fdf2ff] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/10 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="container relative z-10 py-5">
        <div className="mx-auto max-w-7xl text-center">
          {/* Headline */}
          <h1 className="mb-8 animate-fade-in-up leading-tight" style={{ animationDelay: "0.1s" }}>
            <span className="block text-ink font-extrabold text-4xl md:text-6xl lg:text-7xl">
              Writing,
            </span>
            <span className="block headline-gradient font-extrabold text-4xl md:text-6xl lg:text-7xl">
              Perfected.
            </span>
            <span className="block text-muted text-xl md:text-2xl lg:text-3xl font-medium mt-2 tracking-tight">
              Humanize AI with WriteHuman
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted mb-5 max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Turn AI into natural writing with the world's most powerful AI humanizer.
          </p>

          {/* Editor Section */}
          <div className="max-w-7xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {/* Split Pane Layout */}
            <div className={`grid gap-4 transition-all duration-200 ease-in-out ${isSplit ? "lg:grid-cols-2 grid-cols-1" : "grid-cols-1"}`}>
              {/* Input Pane */}
              <div id="inputPane" className="rounded-2xl shadow-sm border bg-white w-full">
                <div className="relative h-full">
                  <textarea
                    id="inputText"
                    value={text}
                    onChange={handleTextChange}
                    onFocus={handleTextareaFocus}
                    onBlur={handleTextareaBlur}
                    placeholder="Paste or write your text…"
                    disabled={isProcessing}
                    className="w-full h-full resize-none leading-7 focus:outline-none p-6 rounded-2xl text-base"
                    style={{ minHeight: isSplit ? "500px" : "450px" }}
                  />
                  
                  {/* Floating Buttons */}
                  {!text && !isProcessing && !isSplit && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      <button
                        onClick={handlePaste}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-white/90 border border-primary/20 hover:border-primary/40 rounded-xl text-sm sm:text-base font-medium text-primary transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap"
                      >
                        <ClipboardPaste className="h-4 w-4 sm:h-5 sm:w-5" />
                        Paste Text
                      </button>
                      <button
                        onClick={handleTrySample}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-white/90 border border-accent/20 hover:border-accent/40 rounded-xl text-sm sm:text-base font-medium text-accent transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap"
                      >
                        <ImagePlus className="h-4 w-4 sm:h-5 sm:w-5" />
                        Try Sample
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Output Pane */}
              {isSplit && (
                <div id="outputPane" className="rounded-2xl shadow-sm border bg-white transition-all duration-200 ease-in-out relative">
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    <button
                      onClick={handleCopyOutput}
                      disabled={!output}
                      className="p-2 bg-white hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 shadow-sm border border-slate-200"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownloadOutput}
                      disabled={!output}
                      className="p-2 bg-white hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 shadow-sm border border-slate-200"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div
                    id="outputText"
                    ref={outputRef}
                    className="w-full p-6 overflow-y-auto overflow-x-hidden text-base text-left"
                    style={{ minHeight: "500px", maxHeight: "600px" }}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      renderOutputWithThesaurus()
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls Panel */}
            <div className="glass-panel rounded-xl p-4 sm:p-6 mt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <CustomSwitch
                      id="enhanced-model"
                      checked={enhancedModel}
                      onCheckedChange={handleEnhancedModelToggle}
                      disabled={isProcessing}
                    />
                    <label
                      htmlFor="enhanced-model"
                      className="text-sm font-medium text-ink cursor-pointer flex items-center gap-2"
                      onClick={handleEnhancedModelToggle}
                    >
                      <span>Enhanced Model</span>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        ⚡
                      </span>
                    </label>
                  </div>
                  <button className="btn-outline text-sm px-3 py-1.5" disabled={isProcessing}>
                    Customize
                  </button>
                  <button
                    onClick={handleClear}
                    className="btn-outline text-sm px-3 py-1.5"
                    disabled={isProcessing}
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span id="wordCounter" className="text-sm text-muted font-medium">
                    {wordCount} words
                  </span>
                  <Button
                    id="writeHumanBtn"
                    className="btn-primary px-6 py-2.5 text-base font-semibold"
                    onClick={handleWriteHuman}
                    disabled={isProcessing || !text.trim()}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Humanizing…
                      </>
                    ) : (
                      "Write Human"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Model Modal */}
      {showEnhancedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowEnhancedModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ×
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-ink mb-2">Enhanced Model</h3>
            </div>
            <div className="text-center space-y-4 mb-6">
              <p className="text-muted leading-relaxed">
                The enhanced model is available for WriteHuman Basic, Pro, and Ultra subscribers.
              </p>
              <p className="text-muted leading-relaxed">
                The enhanced model is our latest model designed to bypass the most stringent detectors like Originality 3.0 and Turnitin.
              </p>
              <p className="text-muted leading-relaxed">This model is updated regularly.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setShowEnhancedModal(false)} className="btn-outline flex-1">
                Maybe Later
              </Button>
              <Button className="btn-primary flex-1">Upgrade Now</Button>
            </div>
          </div>
        </div>
      )}

      {/* Gradient Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-32 bg-gradient-to-b from-transparent via-white/10 to-white/20"></div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    </section>
  );
}
