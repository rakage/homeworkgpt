"use client";

import React, { useState } from "react";
import { ClipboardPaste, ImagePlus } from "lucide-react";
import { Button } from "./ui/button";
import { CustomSwitch } from "./ui/custom-switch";

export function Hero() {
  const [text, setText] = useState("");
  const [enhancedModel, setEnhancedModel] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);

  // Calculate word count
  const calculateWordCount = (text: string) => {
    const cleanText = text
      .trim()
      .replace(/[\r\n]+/g, " ") // Replace newlines with space
      .replace(/[.,!?;:()[\]{}'"]/g, " ") // Replace punctuation with space
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();

    return cleanText === "" ? 0 : cleanText.split(" ").length;
  };

  const wordCount = calculateWordCount(text);

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
    // Check if user is logged in (you can replace this with actual auth check)
    const isLoggedIn = false; // Replace with actual auth state

    if (!isLoggedIn) {
      setShowEnhancedModal(true);
    } else {
      setEnhancedModel(!enhancedModel);
    }
  };

  const handleClear = () => {
    setText("");
  };

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center pt-20">
      {/* Background with gradients and blobs */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8f7ff] via-[#fcf9ff] to-[#fdf2ff]">
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 gradient-mesh opacity-40" />

        {/* Radial gradient for depth */}
        <div className="absolute inset-0 bg-hero-radial opacity-70">
          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Decorative blobs with reduced opacity */}
          <div className="blob-top-left opacity-30" />
          <div className="blob-bottom-right opacity-30" />
        </div>

        {/* Continuous gradient flow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f7ff]/50 via-[#fcf9ff]/70 to-[#fdf2ff] pointer-events-none" />

        {/* Subtle vertical bands */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/10 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="container relative z-10 py-5">
        <div className="mx-auto max-w-6xl text-center">
          {/* Headline */}
          <h1
            className="mb-8 animate-fade-in-up leading-tight"
            style={{ animationDelay: "0.1s" }}
          >
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

          {/* Subcopy */}
          <p
            className="text-xl md:text-2xl text-muted mb-5 max-w-4xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Turn AI into natural writing with the world's most powerful AI
            humanizer.
          </p>

          {/* Full-width Textarea Section */}
          <div
            className="max-w-6xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            {/* Enhanced Interactive Textarea */}
            <div className="relative w-full mb-6">
              <textarea
                value={text}
                onChange={handleTextChange}
                onFocus={handleTextareaFocus}
                onBlur={handleTextareaBlur}
                placeholder="Start typing or paste your text here..."
                className="w-full h-64 p-8 rounded-2xl border-0 bg-white/50 text-lg resize-none relative z-20 focus:outline-none transition-all duration-300 glass-panel"
                style={{
                  backgroundColor:
                    isTextareaFocused || text
                      ? "rgba(255, 255, 255, 0.9)"
                      : "rgba(255, 255, 255, 0.5)",
                  boxShadow: isTextareaFocused
                    ? "0 20px 40px rgba(124, 58, 237, 0.15), 0 10px 30px rgba(16, 24, 40, 0.08)"
                    : "0 15px 35px rgba(16, 24, 40, 0.10)",
                }}
              />

              {/* Floating Action Buttons */}
              {!text && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 z-30">
                  <button
                    onClick={handlePaste}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 border border-primary/20 hover:border-primary/40 rounded-xl text-base font-medium text-primary hover:text-primary transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <ClipboardPaste className="h-5 w-5" />
                    Paste Text
                  </button>
                  <button
                    onClick={handleTrySample}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 border border-accent/20 hover:border-accent/40 rounded-xl text-base font-medium text-accent hover:text-accent transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <ImagePlus className="h-5 w-5" />
                    Try Sample
                  </button>
                </div>
              )}
            </div>

            {/* Controls Panel */}
            <div className="glass-panel rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <CustomSwitch
                      id="enhanced-model"
                      checked={enhancedModel}
                      onCheckedChange={handleEnhancedModelToggle}
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
                  <button className="btn-outline text-sm px-3 py-1.5">
                    Customize
                  </button>
                  <button
                    onClick={handleClear}
                    className="btn-outline text-sm px-3 py-1.5"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-sm text-muted font-medium">
                    Words: {wordCount}/200
                  </span>
                  <Button className="btn-primary px-6 py-2.5 text-base font-semibold">
                    Write Human
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
              <h3 className="text-2xl font-bold text-ink mb-2">
                Enhanced Model
              </h3>
            </div>

            <div className="text-center space-y-4 mb-6">
              <p className="text-muted leading-relaxed">
                The enhanced model is available for WriteHuman Basic, Pro, and
                Ultra subscribers.
              </p>
              <p className="text-muted leading-relaxed">
                The enhanced model is our latest model designed to bypass the
                most stringent detectors like Originality 3.0 and Turnitin.
              </p>
              <p className="text-muted leading-relaxed">
                This model is updated regularly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowEnhancedModal(false)}
                className="btn-outline flex-1"
              >
                Maybe Later
              </Button>
              <Button className="btn-primary flex-1">Upgrade Now</Button>
            </div>
          </div>
        </div>
      )}

      {/* Gradient Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Main gradient */}
        <div className="h-32 bg-gradient-to-b from-transparent via-white/10 to-white/20"></div>
        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    </section>
  );
}
