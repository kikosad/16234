
import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import ImageUpload from './common/ImageUpload';
import Spinner from './common/Spinner';
import Icon from './Icon';

interface ImageData {
    file: File;
    base64: string;
    mimeType: string;
    previewUrl: string;
}

const ImageAnalyzer: React.FC = () => {
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [prompt, setPrompt] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageUpload = (file: File, base64: string, mimeType: string) => {
        const previewUrl = URL.createObjectURL(file);
        setImageData({ file, base64, mimeType, previewUrl });
        setAnalysis('');
        setError('');
    };

    const handleAnalyze = async () => {
        if (!imageData || !prompt.trim()) {
            setError('Por favor, sube una imagen e ingresa una pregunta.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            const result = await analyzeImage(prompt, imageData.base64, imageData.mimeType);
            setAnalysis(result);
        } catch (err) {
            setError('No se pudo analizar la imagen. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-cyan-400">Analizador de Imágenes</h2>
            <p className="text-center text-gray-400 max-w-2xl mx-auto">Sube una imagen y hazle una pregunta a Gemini al respecto. ¡Descubre los detalles que puedes revelar!</p>
            
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    <ImageUpload 
                        onImageUpload={handleImageUpload} 
                        imagePreviewUrl={imageData?.previewUrl}
                        promptText="Haz clic para subir una imagen"
                    />
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="¿Qué quieres saber sobre la imagen?"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                        rows={3}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !imageData || !prompt.trim()}
                        className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
                    >
                        {isLoading ? <Spinner /> : <><Icon name="labs" className="mr-2"/>Analizar Imagen</>}
                    </button>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4 min-h-[360px] flex flex-col">
                    <h3 className="text-xl font-semibold mb-3 text-cyan-300 border-b border-gray-700 pb-2">Resultado del Análisis</h3>
                    {isLoading ? (
                         <div className="flex-grow flex items-center justify-center">
                            <div className="text-center text-gray-400">
                                <Spinner className="w-10 h-10 mx-auto" />
                                <p className="mt-4">Gemini está analizando...</p>
                            </div>
                        </div>
                    ) : analysis ? (
                        <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap flex-grow overflow-y-auto">
                           <p>{analysis}</p>
                        </div>
                    ) : (
                         <div className="flex-grow flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <Icon name="image_search" className="text-6xl" />
                                <p className="mt-2">Tu análisis aparecerá aquí.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageAnalyzer;
