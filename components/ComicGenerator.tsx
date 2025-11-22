import React, { useState, useRef, useMemo } from 'react';
import { generateComicScript, generateImageForComic, generateComicScriptFromImages } from '../services/geminiService';
import { ComicPanel } from '../types';
import Spinner from './common/Spinner';
import Icon from './Icon';

const COMIC_STYLES = ['Vibrante', 'Manga', 'Vintage', 'Noir'];
const MAX_PANELS = 6;

interface UploadedImage {
    file: File;
    base64: string;
    mimeType: string;
    previewUrl: string;
}

const ComicGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [panels, setPanels] = useState<ComicPanel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [panelCount, setPanelCount] = useState(4);
    const [comicStyle, setComicStyle] = useState(COMIC_STYLES[0]);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const userImageUploadRef = useRef<HTMLInputElement>(null);
    const activePanelIndexRef = useRef<number | null>(null);

    const isImageFirstFlow = uploadedImages.length > 0;
    const currentPanelCount = isImageFirstFlow ? uploadedImages.length : panelCount;

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError('');
        setPanels(Array(currentPanelCount).fill({ description: '', dialogue: '' }));

        try {
            if (isImageFirstFlow) {
                // Flow: User images -> AI script
                const script = await generateComicScriptFromImages(prompt, uploadedImages);
                if (script.length !== currentPanelCount) {
                     throw new Error(`El guion generado (${script.length}) no coincide con el número de imágenes (${currentPanelCount}).`);
                }
                const finalPanels = script.map((panel, index) => ({
                    ...panel,
                    imageUrl: uploadedImages[index].previewUrl
                }));
                setPanels(finalPanels);
            } else {
                // Flow: Text prompt -> AI script -> AI images
                const script = await generateComicScript(prompt, currentPanelCount);
                if (script.length !== currentPanelCount) {
                     throw new Error(`El guion generado no tiene ${currentPanelCount} viñetas.`);
                }
                setPanels(script);

                const imagePromises = script.map(panel => generateImageForComic(panel.description, comicStyle));
                const base64Images = await Promise.all(imagePromises);

                const finalPanels = script.map((panel, index) => ({
                    ...panel,
                    imageUrl: `data:image/png;base64,${base64Images[index]}`
                }));
                setPanels(finalPanels);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo generar el cómic. Inténtalo de nuevo.');
            setPanels([]);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDialogueChange = (newDialogue: string, index: number) => {
        setPanels(prevPanels => {
            const updatedPanels = [...prevPanels];
            updatedPanels[index] = { ...updatedPanels[index], dialogue: newDialogue };
            return updatedPanels;
        });
    };

    const handlePanelClick = (index: number) => {
        activePanelIndexRef.current = index;
        fileInputRef.current?.click();
    };

    const handleFileSelectForReplacement = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const index = activePanelIndexRef.current;

        if (file && index !== null) {
            const imageUrl = URL.createObjectURL(file);
            setPanels(prevPanels => {
                const updatedPanels = [...prevPanels];
                updatedPanels[index] = { ...updatedPanels[index], imageUrl };
                return updatedPanels;
            });
        }
        event.target.value = '';
    };
    
    const handleUserImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        // FIX: Explicitly type the 'file' parameter to 'File' to resolve TypeScript inference issues.
        const filePromises = Array.from(files).slice(0, MAX_PANELS).map((file: File) => {
            return new Promise<UploadedImage>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve({
                        file,
                        base64: base64String,
                        mimeType: file.type,
                        previewUrl: URL.createObjectURL(file)
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        
        Promise.all(filePromises).then(newImages => {
            setUploadedImages(newImages);
            setPanels([]); // Clear generated panels if new images are uploaded
        });

        event.target.value = '';
    };

    const removeUploadedImage = (indexToRemove: number) => {
        setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const gridColsClass = useMemo(() => {
        if (currentPanelCount <= 2) return 'md:grid-cols-2';
        if (currentPanelCount === 3) return 'md:grid-cols-3';
        if (currentPanelCount === 4) return 'md:grid-cols-2';
        return 'md:grid-cols-3';
    }, [currentPanelCount]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-cyan-400 comic-action-font">Generador de Cómics IA</h2>
            <p className="text-center text-gray-400 max-w-2xl mx-auto">Escribe una idea, elige un estilo y genera un cómic. O sube tus propias imágenes para que la IA cree el guion.</p>
            
            <div className="space-y-6 max-w-2xl mx-auto">
                {/* User Image Upload Section */}
                 <div>
                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">Opcional: Sube tus propias imágenes</h3>
                    <div className="p-4 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-xl">
                        <div className="flex items-center justify-center">
                            <button onClick={() => userImageUploadRef.current?.click()} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 font-bold py-2 px-4 rounded-lg flex items-center">
                                <Icon name="upload" className="mr-2"/> Subir Imágenes (hasta {MAX_PANELS})
                            </button>
                        </div>
                        {uploadedImages.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                                {uploadedImages.map((image, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <img src={image.previewUrl} alt={`Imagen subida ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                        <button onClick={() => removeUploadedImage(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isImageFirstFlow ? "Ej: Describe una historia para estas imágenes..." : "Ej: Un astronauta encuentra un gato en la luna."}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    rows={3}
                />
                
                {/* Style and Panel Count Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Estilo de Cómic</label>
                        <div className="flex flex-wrap gap-2">
                            {COMIC_STYLES.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setComicStyle(style)}
                                    disabled={isImageFirstFlow}
                                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${comicStyle === style && !isImageFirstFlow ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'} ${isImageFirstFlow ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="panel-count" className="block text-sm font-medium text-gray-400 mb-2">Número de Viñetas: {currentPanelCount}</label>
                        <input
                            id="panel-count"
                            type="range"
                            min="1"
                            max={MAX_PANELS}
                            value={currentPanelCount}
                            onChange={(e) => setPanelCount(Number(e.target.value))}
                            disabled={isImageFirstFlow}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors comic-action-font text-xl"
                >
                    {isLoading ? <Spinner /> : <><Icon name="draw" className="mr-2"/>{isImageFirstFlow ? '¡Generar Guion!' : '¡Generar Cómic!'}</>}
                </button>
                {error && <p className="text-red-400 text-center">{error}</p>}
            </div>
            
            {panels.length > 0 && (
                <div className="mt-8">
                    <div className={`grid grid-cols-1 ${gridColsClass} gap-4 max-w-4xl mx-auto p-4 bg-gray-900/50 border-4 border-gray-700 rounded-lg`}>
                        {panels.map((panel, index) => (
                            <div 
                                key={index} 
                                className="aspect-square bg-gray-800 rounded-lg shadow-md relative overflow-hidden border-2 border-gray-600 flex items-center justify-center group cursor-pointer"
                                onClick={() => handlePanelClick(index)}
                            >
                                {panel.imageUrl ? (
                                    <img src={panel.imageUrl} alt={`Viñeta del cómic ${index + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-gray-500 p-2">
                                        <Spinner />
                                        <p className="text-xs mt-2">{panel.description || 'Generando imagen...'}</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Icon name="upload" className="text-5xl text-white"/>
                                </div>
                                {panel.dialogue !== undefined && (
                                    <div className="speech-bubble" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={panel.dialogue}
                                            onChange={(e) => handleDialogueChange(e.target.value, index)}
                                            className="w-full bg-transparent text-black text-center comic-font font-bold text-sm md:text-base focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileSelectForReplacement} />
             <input type="file" ref={userImageUploadRef} className="hidden" accept="image/png, image/jpeg, image/webp" multiple onChange={handleUserImageUpload} />
        </div>
    );
};

export default ComicGenerator;