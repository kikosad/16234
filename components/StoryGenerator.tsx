
import React, { useState, useCallback } from 'react';
import { generateStoryFromImage, generateSpeech } from '../services/geminiService';
import { playAudio } from '../utils/audio';
import ImageUpload from './common/ImageUpload';
import Spinner from './common/Spinner';
import Icon from './Icon';

interface ImageData {
    file: File;
    base64: string;
    mimeType: string;
    previewUrl: string;
}

const StoryGenerator: React.FC = () => {
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [story, setStory] = useState('');
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [error, setError] = useState('');

    const handleImageUpload = useCallback(async (file: File, base64: string, mimeType: string) => {
        const previewUrl = URL.createObjectURL(file);
        setImageData({ file, base64, mimeType, previewUrl });
        setStory('');
        setError('');
        setIsGeneratingStory(true);

        try {
            const generatedStory = await generateStoryFromImage(base64, mimeType);
            setStory(generatedStory);
        } catch (err) {
            setError('No se pudo generar la historia. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setIsGeneratingStory(false);
        }
    }, []);

    const handleReadAloud = async () => {
        if (!story) return;
        setIsGeneratingAudio(true);
        setError('');

        try {
            const audioData = await generateSpeech(story);
            if (audioData) {
                await playAudio(audioData);
            } else {
                setError('No se pudo generar el audio para la historia.');
            }
        } catch (err) {
            setError('Ocurrió un error durante la reproducción de audio.');
            console.error(err);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-cyan-400">Iniciador de Historias IA</h2>
            <p className="text-center text-gray-400 max-w-2xl mx-auto">Sube una imagen y deja que Gemini impulse tu escritura creativa con un párrafo de inicio, ¡narrado en español!</p>
            
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div>
                     <ImageUpload 
                        onImageUpload={handleImageUpload} 
                        imagePreviewUrl={imageData?.previewUrl}
                        promptText="Sube una imagen para inspirar una historia"
                    />
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4 min-h-[300px] flex flex-col">
                    <h3 className="text-xl font-semibold mb-3 text-cyan-300 border-b border-gray-700 pb-2">Historia Generada</h3>
                    <div className="flex-grow">
                        {isGeneratingStory ? (
                             <div className="flex h-full items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <Spinner className="w-10 h-10 mx-auto" />
                                    <p className="mt-4">Gemini está escribiendo...</p>
                                </div>
                            </div>
                        ) : story ? (
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                               <p>{story}</p>
                            </div>
                        ) : (
                             <div className="flex h-full items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <Icon name="history_edu" className="text-6xl" />
                                    <p className="mt-2">Tu historia aparecerá aquí.</p>
                                </div>
                            </div>
                        )}
                    </div>
                     {story && !isGeneratingStory && (
                        <button
                            onClick={handleReadAloud}
                            disabled={isGeneratingAudio}
                            className="w-full mt-4 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-teal-400 transition-colors"
                        >
                            {isGeneratingAudio ? <Spinner /> : <><Icon name="volume_up" className="mr-2"/>Leer en voz alta</>}
                        </button>
                    )}
                    {error && <p className="text-red-400 text-center mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default StoryGenerator;
