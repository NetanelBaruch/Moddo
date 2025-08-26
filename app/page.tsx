'use client';

import { useState, useEffect } from 'react';

export default function Page() {
    const [currentStep, setCurrentStep] = useState(1);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setCurrentStep(2);
        }, 2000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const ProgressBar = () => (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50" data-oid="8wv29zg">
            <div
                className="h-full bg-teal-500 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 4) * 100}%` }}
                data-oid="125ohtt"
            />
        </div>
    );

    const LandingScreen = () => (
        <div
            className="min-h-screen bg-slate-900 flex items-center justify-center px-6"
            data-oid="6:4-nca"
        >
            <div className="w-full max-w-2xl" data-oid="hwq9jxx">
                <div className="text-center mb-12" data-oid="irr2_nh">
                    <h1
                        className="text-4xl font-medium text-gray-100 mb-4 tracking-tight"
                        data-oid="hxlmdme"
                    >
                        Moddo
                    </h1>
                    <p className="text-gray-400 text-lg" data-oid="7ux:hv1">
                        GPT for Physical Products
                    </p>
                </div>

                <div className="relative" data-oid="erqdoz1">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="What do you want to create?"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-6 py-4 text-gray-100 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-150"
                        rows={3}
                        disabled={isGenerating}
                        data-oid="6m:5r21"
                    />

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="absolute bottom-4 right-4 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-all duration-150"
                        data-oid=".e-21y:"
                    >
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                </div>

                <p className="text-gray-500 text-sm mt-4 text-center" data-oid="577--3i">
                    Example: cable organizer, 10cm, TPU
                </p>
            </div>
        </div>
    );

    const ConceptStage = () => (
        <div className="min-h-screen bg-slate-900 flex" data-oid="yn4tm2g">
            {/* Chat Thread */}
            <div className="w-1/3 border-r border-gray-800 p-6" data-oid="v9or8ks">
                <h3 className="text-xl font-medium text-gray-100 mb-6" data-oid="ufruz59">
                    Feedback
                </h3>
                <div className="space-y-4" data-oid="0defkha">
                    <div className="bg-gray-800 rounded-lg p-4" data-oid="gxvnc5s">
                        <p className="text-gray-300 text-sm" data-oid="0kvhl86">
                            Generated 4 concept views for: "{prompt}"
                        </p>
                    </div>
                    <div className="bg-teal-900/30 rounded-lg p-4" data-oid="wbln:fd">
                        <p className="text-teal-200 text-sm" data-oid="80.0mnw">
                            Concepts ready! Select your preferred view or provide feedback.
                        </p>
                    </div>
                </div>
            </div>

            {/* Render Grid */}
            <div className="flex-1 p-6" data-oid="rwe9a.l">
                <h2 className="text-2xl font-medium text-gray-100 mb-8" data-oid="8mzgw67">
                    Concept Views
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-8" data-oid="2:4wgh-">
                    {['Front View', 'Back View', 'Side View', 'Top View'].map((view, index) => (
                        <div
                            key={view}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-teal-500 cursor-pointer transition-all duration-150 aspect-square flex items-center justify-center"
                            data-oid="46ny_d4"
                        >
                            <div className="text-center" data-oid="1rq3bxx">
                                <div
                                    className="w-32 h-32 bg-gray-700 rounded-lg mb-4 mx-auto flex items-center justify-center"
                                    data-oid="0.c1hiv"
                                >
                                    <span className="text-gray-500 text-sm" data-oid="dzp5o5_">
                                        Render {index + 1}
                                    </span>
                                </div>
                                <p className="text-gray-300 font-medium" data-oid="g-a214s">
                                    {view}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Specs Panel */}
                <div
                    className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                    data-oid="2-5emzj"
                >
                    <h3 className="text-lg font-medium text-gray-100 mb-4" data-oid="o9zao:p">
                        Generated Specifications
                    </h3>
                    <div className="font-mono text-sm text-gray-300 space-y-2" data-oid="etrrgk3">
                        <div data-oid="-fycoz:">Dimensions: 100mm × 50mm × 20mm</div>
                        <div data-oid="5uond3e">Material: TPU (Flexible)</div>
                        <div data-oid="-gi65hw">
                            Features: Cable management slots, anti-slip base
                        </div>
                        <div data-oid="yl5g8gg">Print Time: ~2.5 hours</div>
                    </div>
                </div>

                <div className="flex justify-end mt-8" data-oid="h818d79">
                    <button
                        onClick={() => setCurrentStep(3)}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-150"
                        data-oid="mqak8ka"
                    >
                        Continue to 3D Preview
                    </button>
                </div>
            </div>
        </div>
    );

    const PreviewStage = () => (
        <div className="min-h-screen bg-slate-900 flex" data-oid="hhpt1:3">
            {/* Controls Sidebar */}
            <div className="w-1/4 border-r border-gray-800 p-6" data-oid="9cibn5m">
                <h3 className="text-xl font-medium text-gray-100 mb-6" data-oid="5b6q.8d">
                    Parameters
                </h3>

                <div className="space-y-6" data-oid="tfgw__0">
                    <div data-oid="3zq64a2">
                        <label
                            className="block text-gray-300 text-sm font-medium mb-2"
                            data-oid="-x2evp_"
                        >
                            Dimensions
                        </label>
                        <div className="space-y-2" data-oid="ojz5do9">
                            <input
                                type="range"
                                className="w-full accent-teal-500"
                                data-oid="j_jg:2s"
                            />

                            <div className="font-mono text-xs text-gray-400" data-oid="00ito81">
                                W: 100mm
                            </div>
                        </div>
                    </div>

                    <div data-oid="9l.dliy">
                        <label
                            className="block text-gray-300 text-sm font-medium mb-2"
                            data-oid="j5zgkx9"
                        >
                            Material
                        </label>
                        <select
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100 text-sm"
                            data-oid="gj0le.4"
                        >
                            <option data-oid="w_k99pa">TPU (Flexible)</option>
                            <option data-oid="0y_isdn">PLA (Standard)</option>
                            <option data-oid="sd712f4">PETG (Durable)</option>
                        </select>
                    </div>

                    <div data-oid="y0wcla5">
                        <label
                            className="block text-gray-300 text-sm font-medium mb-2"
                            data-oid="8w.3dmg"
                        >
                            Environment
                        </label>
                        <div className="grid grid-cols-3 gap-2" data-oid="hjs1-qd">
                            {['Desk', 'Shelf', 'Office'].map((env) => (
                                <button
                                    key={env}
                                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-teal-500 text-gray-300 px-3 py-2 rounded-md text-xs transition-all duration-150"
                                    data-oid="ssy-7q:"
                                >
                                    {env}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3D Viewer */}
            <div className="flex-1 p-6" data-oid="rqsbr:l">
                <h2 className="text-2xl font-medium text-gray-100 mb-8" data-oid=":5pwe64">
                    3D Preview
                </h2>

                <div
                    className="bg-gray-800 border border-gray-700 rounded-lg aspect-video flex items-center justify-center"
                    data-oid="ptm5qkl"
                >
                    <div className="text-center" data-oid="kj7fimx">
                        <div
                            className="w-48 h-48 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center"
                            data-oid="altxef8"
                        >
                            <span className="text-gray-500" data-oid="r53:e27">
                                3D Model Viewer
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm" data-oid="db_pgs7">
                            Interactive 3D preview would render here
                        </p>
                    </div>
                </div>

                <div className="flex justify-end mt-8" data-oid="n4xyt6-">
                    <button
                        onClick={() => setCurrentStep(4)}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-150"
                        data-oid="s9plpoj"
                    >
                        Finalize Design
                    </button>
                </div>
            </div>
        </div>
    );

    const STLViewer = () => (
        <div className="min-h-screen bg-slate-900 flex" data-oid="f3r29l1">
            {/* STL Viewer */}
            <div className="flex-1 p-6" data-oid=":zz7a3.">
                <h2 className="text-2xl font-medium text-gray-100 mb-8" data-oid="6f62_1y">
                    STL Preview
                </h2>

                <div
                    className="bg-gray-800 border border-gray-700 rounded-lg aspect-video flex items-center justify-center mb-8"
                    data-oid="ri:4vaj"
                >
                    <div className="text-center" data-oid="xi:1u_s">
                        <div
                            className="w-64 h-48 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center"
                            data-oid="av-w6:."
                        >
                            <span className="text-gray-500" data-oid="g3y7m97">
                                STL Viewer with Grid
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm" data-oid="5_l.ltx">
                            Final STL model with print bed visualization
                        </p>
                    </div>
                </div>

                <div className="flex gap-4" data-oid="ebr.:xn">
                    <button
                        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-150"
                        data-oid="1:dxntv"
                    >
                        Download STL
                    </button>
                    <button
                        className="border border-coral-500 text-coral-500 hover:bg-coral-500 hover:text-white px-8 py-3 rounded-lg font-medium transition-all duration-150"
                        data-oid="t-u16ee"
                    >
                        Order a Print
                    </button>
                </div>
            </div>

            {/* Specs Sidebar */}
            <div className="w-1/3 border-l border-gray-800 p-6" data-oid="hqwd:9z">
                <h3 className="text-xl font-medium text-gray-100 mb-6" data-oid="poqh2el">
                    Print Specifications
                </h3>

                <div className="space-y-6" data-oid="t72fc3-">
                    <div className="bg-gray-800 rounded-lg p-4" data-oid="vdi8b0v">
                        <h4 className="text-gray-300 font-medium mb-3" data-oid="pa321w0">
                            Model Stats
                        </h4>
                        <div
                            className="font-mono text-sm text-gray-400 space-y-1"
                            data-oid="qq52r2k"
                        >
                            <div data-oid="0h81y-l">Volume: 45.2 cm³</div>
                            <div data-oid="2q4p8e8">Weight: ~52g (TPU)</div>
                            <div data-oid="ajcf-oc">Surface Area: 180 cm²</div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4" data-oid="_eib8:-">
                        <h4 className="text-gray-300 font-medium mb-3" data-oid="mpism4i">
                            Print Estimates
                        </h4>
                        <div
                            className="font-mono text-sm text-gray-400 space-y-1"
                            data-oid="0_yq-ie"
                        >
                            <div data-oid="gmmrw-f">Print Time: 2h 34m</div>
                            <div data-oid="lt7-xav">Material Cost: $3.20</div>
                            <div data-oid="oeug7di">Layer Height: 0.2mm</div>
                        </div>
                    </div>

                    <div
                        className="bg-green-900/30 border border-green-700 rounded-lg p-4"
                        data-oid="wc9osf_"
                    >
                        <h4 className="text-green-300 font-medium mb-2" data-oid="2c4u:03">
                            ✓ Printability Check
                        </h4>
                        <p className="text-green-200 text-sm" data-oid="161w99t">
                            Model is print-ready with no issues detected.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-900 min-h-screen font-sans" data-oid="pbq-rw0">
            <ProgressBar data-oid="yemynw_" />

            {currentStep === 1 && <LandingScreen data-oid="fxn2lvg" />}
            {currentStep === 2 && <ConceptStage data-oid="7kzp_1:" />}
            {currentStep === 3 && <PreviewStage data-oid="8hxzxyn" />}
            {currentStep === 4 && <STLViewer data-oid="gggjs-7" />}
        </div>
    );
}
