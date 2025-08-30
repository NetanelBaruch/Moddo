'use client';

import { useState, useEffect } from 'react';
import {
    useProjectGeneration,
    useFeedback,
    useModelGeneration,
    useSTLConversion,
    useProjectFlow,
} from '@/lib/hooks';
import { ConceptGenerationResponse } from '@/lib/types';

/**
 * Main Moddo Application Component
 *
 * This component orchestrates the entire user journey from prompt to printable product:
 * 1. Landing: User enters a product idea
 * 2. Concepts: AI generates 4 concept images with feedback loop
 * 3. 3D Preview: Convert approved concept to interactive 3D model
 * 4. STL Export: Generate printable file with quality checks
 *
 * Business Context: This is the core user experience that demonstrates
 * Moddo's value proposition - turning ideas into physical products through
 * an intuitive, AI-powered pipeline.
 */

// Legacy Comment interface for backward compatibility
// Will be replaced with real Feedback data from API
interface Comment {
    id: string;
    text: string;
    author: string;
    timestamp: Date;
    emoji: string;
    position?: { x: number; y: number };
    viewIndex?: number;
}

export default function Page() {
    // Main application state management using custom hooks
    const {
        currentStep,
        projectId,
        userId,
        progressPercentage,
        setProjectId,
        setCurrentStep,
        nextStep,
    } = useProjectFlow();

    // Project generation and concept creation
    const {
        generateProject,
        isGenerating,
        error: generationError,
        currentProject,
    } = useProjectGeneration();

    // Feedback management for concept refinement
    const feedbackHook = useFeedback(projectId || '', userId);

    // 3D model generation from approved concepts
    const {
        generateModel,
        isGenerating: isGeneratingModel,
        error: modelError,
        modelData,
    } = useModelGeneration();

    // STL conversion and download
    const {
        convertToSTL,
        isConverting,
        error: stlError,
        stlData,
        getDownloadUrl,
    } = useSTLConversion();

    // Local UI state
    const [prompt, setPrompt] = useState('');
    const [selectedConceptIndex, setSelectedConceptIndex] = useState<number | null>(null);
    const [newComment, setNewComment] = useState('');
    const [selectedView, setSelectedView] = useState<number | null>(null);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });

    // Legacy comments for backward compatibility (will be replaced by feedbackHook.feedback)
    const [comments, setComments] = useState<Comment[]>([]);

    /**
     * Handle project generation from user prompt
     * This is the core "magic moment" where ideas become visual concepts
     */
    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        try {
            // Call the real API to generate concepts
            const result = await generateProject(prompt.trim(), userId);

            // Store the project ID for subsequent API calls
            setProjectId(result.projectId);

            // Move to concepts stage
            nextStep();

            console.log('Project generated successfully:', result.projectId);
        } catch (error) {
            console.error('Failed to generate project:', error);
            // For MVP, we'll show a simple alert. In production, use proper error UI
            alert('Sorry, something went wrong generating your concepts. Please try again!');
        }
    };

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const funEmojis = ['🚀', '✨', '🎯', '💡', '🔥', '⚡', '🎨', '🌟', '💫', '🎪'];
    const getRandomEmoji = () => funEmojis[Math.floor(Math.random() * funEmojis.length)];

    const addComment = (text: string, viewIndex?: number) => {
        if (!text.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            text: text.trim(),
            author: 'You',
            timestamp: new Date(),
            emoji: getRandomEmoji(),
            viewIndex,
            position: showCommentInput ? commentPosition : undefined,
        };

        setComments((prev) => [...prev, comment]);
        setNewComment('');
        setShowCommentInput(false);
        setSelectedView(null);
    };

    const handleViewClick = (e: React.MouseEvent, viewIndex: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCommentPosition({ x, y });
        setSelectedView(viewIndex);
        setShowCommentInput(true);
    };

    const getViewComments = (viewIndex: number) => {
        return comments.filter((comment) => comment.viewIndex === viewIndex);
    };

    const ProgressBar = () => (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50" data-oid="dsr_c04">
            <div
                className="h-full bg-teal-500 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 4) * 100}%` }}
                data-oid="4x07ohg"
            />
        </div>
    );

    const LandingScreen = () => (
        <div
            className="min-h-screen bg-slate-900 flex items-center justify-center px-6"
            data-oid="mnlkfkh"
        >
            <div className="w-full max-w-2xl" data-oid="b3qy17n">
                <div className="text-center mb-12" data-oid="86rne_u">
                    <div className="flex items-center justify-center gap-3 mb-4" data-oid="levu8cb">
                        <span className="text-4xl" data-oid="k1n05j1">
                            🎯
                        </span>
                        <h1
                            className="text-4xl font-medium text-gray-100 tracking-tight"
                            data-oid="b7yada6"
                        >
                            Moddo
                        </h1>
                        <span className="text-4xl" data-oid="wc3th5u">
                            ✨
                        </span>
                    </div>
                    <p className="text-gray-400 text-lg" data-oid="54vcm3b">
                        🚀 GPT for Physical Products - Let&apos;s create something amazing!
                    </p>
                </div>

                <div className="relative" data-oid="e9k-.8m">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="What do you want to create? 🤔 (e.g., cable organizer, phone stand, desk gadget...)"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-6 py-4 text-gray-100 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-150"
                        rows={3}
                        disabled={isGenerating}
                        data-oid="_q04xdm"
                    />

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="absolute bottom-4 right-4 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-all duration-150 flex items-center gap-2"
                        data-oid="pw65zmy"
                    >
                        {isGenerating ? (
                            <>
                                <span data-oid="6jjvmua">Generating</span>
                                <span className="animate-spin" data-oid="lcss69p">
                                    ⚡
                                </span>
                            </>
                        ) : (
                            <>
                                <span data-oid="2v3:irh">Generate</span>
                                <span data-oid="b_2ssgr">🚀</span>
                            </>
                        )}
                    </button>
                </div>

                <p className="text-gray-500 text-sm mt-4 text-center" data-oid="8tkqs68">
                    💡 Example: cable organizer, 10cm, TPU • phone stand, adjustable • desk
                    organizer, modular
                </p>
            </div>
        </div>
    );

    const ConceptStage = () => (
        <div className="min-h-screen bg-slate-900 flex" data-oid="kgi6k-_">
            {/* Enhanced Feedback Panel */}
            <div className="w-1/3 border-r border-gray-800 p-6 flex flex-col" data-oid="x0qf6v-">
                <div className="flex items-center gap-2 mb-6" data-oid=".n6uldv">
                    <h3 className="text-xl font-medium text-gray-100" data-oid="g5-azfi">
                        Feedback & Comments
                    </h3>
                    <span className="text-2xl" data-oid="5o12b1i">
                        💬
                    </span>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto" data-oid="bw0jkss">
                    <div className="bg-gray-800 rounded-lg p-4" data-oid="rdvy0rh">
                        <div className="flex items-center gap-2 mb-2" data-oid="1iuphiz">
                            <span className="text-xl" data-oid="jy0r6gv">
                                🎨
                            </span>
                            <p className="text-gray-300 text-sm font-medium" data-oid="9e7jm--">
                                Moddo AI
                            </p>
                        </div>
                        <p className="text-gray-300 text-sm" data-oid="i-m4qh-">
                            Generated 4 concept views for: &ldquo;{prompt}&rdquo;
                        </p>
                    </div>

                    <div className="bg-teal-900/30 rounded-lg p-4" data-oid="3a7vgp9">
                        <div className="flex items-center gap-2 mb-2" data-oid="6nph.n4">
                            <span className="text-xl" data-oid="-xyxyv:">
                                ✨
                            </span>
                            <p className="text-teal-200 text-sm font-medium" data-oid="zcefkud">
                                Moddo AI
                            </p>
                        </div>
                        <p className="text-teal-200 text-sm" data-oid="jvhtqa7">
                            Concepts ready! Click on any view to add comments or feedback.
                            Let&apos;s make this awesome! 🚀
                        </p>
                    </div>

                    {/* User Comments */}
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4"
                            data-oid="r-a54iw"
                        >
                            <div className="flex items-center gap-2 mb-2" data-oid="0g1bg2w">
                                <span className="text-lg" data-oid="ne696al">
                                    {comment.emoji}
                                </span>
                                <p
                                    className="text-purple-200 text-sm font-medium"
                                    data-oid="sr5.2az"
                                >
                                    {comment.author}
                                </p>
                                <span className="text-purple-300 text-xs" data-oid="xxvl4k6">
                                    {comment.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-purple-100 text-sm" data-oid="zoexa8t">
                                {comment.text}
                            </p>
                            {comment.viewIndex !== undefined && (
                                <p className="text-purple-300 text-xs mt-1" data-oid="qqyomcp">
                                    📍{' '}
                                    {
                                        ['Front View', 'Back View', 'Side View', 'Top View'][
                                            comment.viewIndex
                                        ]
                                    }
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Quick Comment Input */}
                <div className="mt-4 pt-4 border-t border-gray-700" data-oid="04.1i0n">
                    <div className="flex gap-2" data-oid="3-kjywl">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    addComment(newComment);
                                }
                            }}
                            placeholder="Add a quick comment... ✨"
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            data-oid="9wwm0g_"
                        />

                        <button
                            onClick={() => addComment(newComment)}
                            disabled={!newComment.trim()}
                            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                            data-oid="4.0m.3f"
                        >
                            💫
                        </button>
                    </div>
                </div>
            </div>

            {/* Render Grid */}
            <div className="flex-1 p-6" data-oid="4rr6mk0">
                <h2 className="text-2xl font-medium text-gray-100 mb-8" data-oid=".k-xzps">
                    Concept Views
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-8" data-oid="t0bvbd-">
                    {['Front View', 'Back View', 'Side View', 'Top View'].map((view, index) => (
                        <div
                            key={view}
                            className="relative bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-teal-500 cursor-pointer transition-all duration-150 aspect-square flex items-center justify-center group"
                            onClick={(e) => handleViewClick(e, index)}
                            data-oid="py0jszj"
                        >
                            {/* Comment Indicator */}
                            {getViewComments(index).length > 0 && (
                                <div
                                    className="absolute top-2 right-2 bg-purple-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
                                    data-oid="ser-gl:"
                                >
                                    {getViewComments(index).length}
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div
                                className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-lg flex items-center justify-center"
                                data-oid=":8oipt5"
                            >
                                <span
                                    className="text-teal-300 text-sm font-medium"
                                    data-oid="ht5fvqs"
                                >
                                    💬 Click to comment
                                </span>
                            </div>

                            <div className="text-center" data-oid="y10_n-5">
                                <div
                                    className="w-32 h-32 bg-gray-700 rounded-lg mb-4 mx-auto flex items-center justify-center relative overflow-hidden"
                                    data-oid="h_n9vaa"
                                >
                                    {/* Simulated render with gradient */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-purple-400/20"
                                        data-oid="sj_k0ar"
                                    ></div>
                                    <span
                                        className="text-gray-400 text-sm relative z-10"
                                        data-oid="gwp8f6c"
                                    >
                                        🎯 Render {index + 1}
                                    </span>
                                </div>
                                <p className="text-gray-300 font-medium" data-oid="iv:_l09">
                                    {view}
                                </p>
                            </div>

                            {/* Comment Input Overlay */}
                            {showCommentInput && selectedView === index && (
                                <div
                                    className="absolute bg-gray-900 border border-purple-500 rounded-lg p-3 shadow-lg z-20 min-w-64"
                                    style={{
                                        left: Math.min(commentPosition.x, 200),
                                        top: Math.min(commentPosition.y, 100),
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    data-oid="ezy0vo1"
                                >
                                    <div
                                        className="flex items-center gap-2 mb-2"
                                        data-oid="fmljsar"
                                    >
                                        <span className="text-lg" data-oid="1o9d3o1">
                                            💭
                                        </span>
                                        <span
                                            className="text-purple-300 text-sm font-medium"
                                            data-oid="o18ijve"
                                        >
                                            Add comment to {view}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                addComment(newComment, index);
                                            } else if (e.key === 'Escape') {
                                                setShowCommentInput(false);
                                                setNewComment('');
                                            }
                                        }}
                                        placeholder="What do you think? 🤔"
                                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                                        autoFocus
                                        data-oid=".:yequx"
                                    />

                                    <div className="flex gap-2" data-oid="u90i:8b">
                                        <button
                                            onClick={() => addComment(newComment, index)}
                                            disabled={!newComment.trim()}
                                            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-all duration-150"
                                            data-oid="lmyk50j"
                                        >
                                            ✨ Add
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCommentInput(false);
                                                setNewComment('');
                                            }}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-all duration-150"
                                            data-oid="g-am16z"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Specs Panel */}
                <div
                    className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                    data-oid="9:iu:_k"
                >
                    <h3 className="text-lg font-medium text-gray-100 mb-4" data-oid="f:2szli">
                        Generated Specifications
                    </h3>
                    <div className="font-mono text-sm text-gray-300 space-y-2" data-oid="lo13w-0">
                        <div data-oid="pw47drd">Dimensions: 100mm × 50mm × 20mm</div>
                        <div data-oid="w8lr.d3">Material: TPU (Flexible)</div>
                        <div data-oid="tyy5u9g">
                            Features: Cable management slots, anti-slip base
                        </div>
                        <div data-oid=":og-3su">Print Time: ~2.5 hours</div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8" data-oid="yqlbj.0">
                    <div className="flex items-center gap-4" data-oid="ejep08n">
                        <div
                            className="flex items-center gap-2 text-gray-400 text-sm"
                            data-oid=":d4.pmv"
                        >
                            <span className="text-lg" data-oid="6nqqsh0">
                                💬
                            </span>
                            <span data-oid="qk-9yoo">
                                {comments.length} comment{comments.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {comments.length > 0 && (
                            <div
                                className="flex items-center gap-2 text-gray-400 text-sm"
                                data-oid="7-sviuu"
                            >
                                <span className="text-lg" data-oid="i8tg5f1">
                                    🎉
                                </span>
                                <span data-oid="ak66b6y">Great feedback!</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setCurrentStep(3)}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-150 flex items-center gap-2"
                        data-oid="l8b6o5s"
                    >
                        <span data-oid="6g59cnu">Continue to 3D Preview</span>
                        <span className="text-lg" data-oid="d3r-lpb">
                            🚀
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );

    const PreviewStage = () => (
        <div className="min-h-screen bg-slate-900 flex" data-oid="ox:h:_t">
            {/* Controls Sidebar */}
            <div className="w-1/4 border-r border-gray-800 p-6" data-oid="n803_ay">
                <h3 className="text-xl font-medium text-gray-100 mb-6" data-oid="9c5mq31">
                    Parameters
                </h3>
                <div className="space-y-6" data-oid="va.g.su">
                    <div data-oid="oiupsr4">
                        <label
                            className="block text-gray-300 text-sm font-medium mb-2"
                            data-oid="7pb2fcu"
                        >
                            Dimensions
                        </label>
                        <div className="space-y-2" data-oid="oinb:-6">
                            <input
                                type="range"
                                className="w-full accent-teal-500"
                                data-oid="_2y54gh"
                            />

                            <div className="font-mono text-xs text-gray-400" data-oid="977ja7j">
                                W: 100mm
                            </div>
                        </div>
                    </div>
                    <div data-oid="x_fb7gh">
                        <label
                            className="block text-gray-300 text-sm font-medium mb-2"
                            data-oid="fq0uj7."
                        >
                            Material
                        </label>
                        <select
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100 text-sm"
                            data-oid="ukb270m"
                        >
                            <option data-oid="kwux6ks">TPU (Flexible)</option>
                            <option data-oid="e4_01ov">PLA (Standard)</option>
                            <option data-oid="9cd3m8p">PETG (Durable)</option>
                        </select>
                    </div>
                    <div data-oid="nm9jc2x">
                        <label
                            className="block text-gray-300 text-sm font-medium mb-2"
                            data-oid="5hfilkd"
                        >
                            Environment
                        </label>
                        <div className="grid grid-cols-3 gap-2" data-oid="0eq6kqf">
                            {['Desk', 'Shelf', 'Office'].map((env) => (
                                <button
                                    key={env}
                                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-teal-500 text-gray-300 px-3 py-2 rounded-md text-xs transition-all duration-150"
                                    data-oid="s31vffq"
                                >
                                    {env}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3D Viewer */}
            <div className="flex-1 p-6" data-oid="qb0l1lz">
                <h2 className="text-2xl font-medium text-gray-100 mb-8" data-oid="nt27kph">
                    3D Preview
                </h2>
                <div
                    className="bg-gray-800 border border-gray-700 rounded-lg aspect-video flex items-center justify-center"
                    data-oid="mt_2597"
                >
                    <div className="text-center" data-oid=":8y4d5m">
                        <div
                            className="w-48 h-48 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center"
                            data-oid="p:cvn4e"
                        >
                            <span className="text-gray-500" data-oid="_2jhnfd">
                                3D Model Viewer
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm" data-oid="psc5k7:">
                            Interactive 3D preview would render here
                        </p>
                    </div>
                </div>
                <div className="flex justify-end mt-8" data-oid="hcrp3m7">
                    <button
                        onClick={() => setCurrentStep(4)}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-150"
                        data-oid="vcn1:si"
                    >
                        Finalize Design
                    </button>
                </div>
            </div>
        </div>
    );

    const STLViewer = () => (
        <div className="min-h-screen bg-slate-900 flex" data-oid="_d8xl2w">
            {/* STL Viewer */}
            <div className="flex-1 p-6" data-oid="mloy9r1">
                <h2 className="text-2xl font-medium text-gray-100 mb-8" data-oid="64s25fg">
                    STL Preview
                </h2>
                <div
                    className="bg-gray-800 border border-gray-700 rounded-lg aspect-video flex items-center justify-center mb-8"
                    data-oid="cl_2vqg"
                >
                    <div className="text-center" data-oid="xbrl572">
                        <div
                            className="w-64 h-48 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center"
                            data-oid="yz11q9q"
                        >
                            <span className="text-gray-500" data-oid="57avki9">
                                STL Viewer with Grid
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm" data-oid="iss59j0">
                            Final STL model with print bed visualization
                        </p>
                    </div>
                </div>
                <div className="flex gap-4" data-oid="70t5-nn">
                    <button
                        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-150"
                        data-oid="gqupm:6"
                    >
                        Download STL
                    </button>
                    <button
                        className="border border-coral-500 text-coral-500 hover:bg-coral-500 hover:text-white px-8 py-3 rounded-lg font-medium transition-all duration-150"
                        data-oid="qbtj_ho"
                    >
                        Order a Print
                    </button>
                </div>
            </div>

            {/* Specs Sidebar */}
            <div className="w-1/3 border-l border-gray-800 p-6" data-oid="h:-_u6l">
                <h3 className="text-xl font-medium text-gray-100 mb-6" data-oid="kyk6n:l">
                    Print Specifications
                </h3>
                <div className="space-y-6" data-oid="vr2w4id">
                    <div className="bg-gray-800 rounded-lg p-4" data-oid="32c6i:8">
                        <h4 className="text-gray-300 font-medium mb-3" data-oid="r2j3mis">
                            Model Stats
                        </h4>
                        <div
                            className="font-mono text-sm text-gray-400 space-y-1"
                            data-oid="4.rixy."
                        >
                            <div data-oid="w.pyjyy">Volume: 45.2 cm³</div>
                            <div data-oid="gl4m_x0">Weight: ~52g (TPU)</div>
                            <div data-oid="gtgydvj">Surface Area: 180 cm²</div>
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4" data-oid="7qkimue">
                        <h4 className="text-gray-300 font-medium mb-3" data-oid="oh64ak1">
                            Print Estimates
                        </h4>
                        <div
                            className="font-mono text-sm text-gray-400 space-y-1"
                            data-oid="s0-rrgn"
                        >
                            <div data-oid="nj7:25f">Print Time: 2h 34m</div>
                            <div data-oid="2ffe-pd">Material Cost: $3.20</div>
                            <div data-oid="f90e-ma">Layer Height: 0.2mm</div>
                        </div>
                    </div>
                    <div
                        className="bg-green-900/30 border border-green-700 rounded-lg p-4"
                        data-oid="l31eqp."
                    >
                        <h4 className="text-green-300 font-medium mb-2" data-oid="2ojsko:">
                            ✓ Printability Check
                        </h4>
                        <p className="text-green-200 text-sm" data-oid="22j:gip">
                            Model is print-ready with no issues detected.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-900 min-h-screen font-sans" data-oid="l93sae5">
            <ProgressBar data-oid="ksc9nsl" />
            {currentStep === 1 && <LandingScreen data-oid="tfh3u8i" />}
            {currentStep === 2 && <ConceptStage data-oid="iv-c0xo" />}
            {currentStep === 3 && <PreviewStage data-oid="c0.w2qn" />}
            {currentStep === 4 && <STLViewer data-oid="wan4v2v" />}
        </div>
    );
}
