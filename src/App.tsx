import { useEffect, useState } from 'react'
import { read_img, alloc } from "../hello-wasm/pkg";
import { memory } from '../hello-wasm/pkg/hello_wasm_bg.wasm';

const sortingAlgorithms = [
    { name: "lightness" },
    { name: "saturation" },
    { name: "hue" },
];

const excludePixels = [
    { name: "lightness_threshold" },
    { name: "saturation_threshold" },
    { name: "hue_threshold" },
    { name: "random_exclude" },
];

const rotationDegrees = [
    { name: "0" },
    { name: "90" },
    { name: "180" },
    { name: "270" },
];

function App() {
    const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>();
    // const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>("https://placehold.co/1600x1200");
    const [editedImageUrl, setEditedImageUrl] = useState<string | undefined>();

    // Write a useReducer that stores the contents of the form below
    const [formState, setFormState] = useState({
        sortingAlg: "lightness",
        excludePixels: "lightness_threshold",
        rotationDegrees: "0",
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('submitting form');
        // Run pixel sorting here
        // Take new image and create object URL
        setEditedImageUrl("https://placehold.co/1600x1200");
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormState({
            ...formState,
            [e.target.id]: e.target.value,
        });
    }

    function convertSerializedImageDataToImage(imageData: string) {
        const { U8: { data: { red, green, blue }, width, height }, } = JSON.parse(imageData);
        // function createImageFromChannels(redChannel, greenChannel, blueChannel, width, height) {
        const image = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width * 4) + (x * 4);
                const redValue = red[y * width + x];
                const greenValue = green[y * width + x];
                const blueValue = blue[y * width + x];
                image[pixelIndex] = redValue;
                image[pixelIndex + 1] = greenValue;
                image[pixelIndex + 2] = blueValue;
                image[pixelIndex + 3] = 255; // alpha channel
            }
        }
        return image;
    }

    async function pixelSortImage(img: any) {
        setOriginalImageUrl(URL.createObjectURL(img));
        const buffer = await img.arrayBuffer();
        console.log({ buffer: new Uint8Array(buffer) });
        const len = buffer.byteLength;
        const ptr = alloc(len);
        console.log({ len, ptr });

        const imgArray = new Uint8Array(memory.buffer, ptr, len);    
        imgArray.set(new Uint8Array(buffer));

        const t = read_img(ptr, len);
        console.log({ t });
        try {
            const image = convertSerializedImageDataToImage(t);
            console.log({ image });
            const objectUrl  = URL.createObjectURL(new Blob([image], { type: 'image/png' }));
            console.log({ objectUrl });
        } catch (e) {
            // ignore error
        }
    }

    if (originalImageUrl) {
        return (
            <div className="h-screen flex gap-12 px-8 items-center justify-center bg-gradient-to-br from-indigo-100 to-fuchsia-200">
                <form onSubmit={handleSubmit} className="shadow px-8 py-4 flex flex-col grow gap-8 border-4 border-indigo-500 rounded-xl max-w-md min-w-64">
                    <p className="font-semibold self-center">Pixel Sorting</p>
                    <div>
                        <label htmlFor="sortingAlgorithm" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Sorting Method
                        </label>
                        <select id="sortingAlgorithm" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >                            
                            {sortingAlgorithms.map((alg) => (
                                <option key={alg.name} value={alg.name}>{alg.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="excludePixels" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Exclude Method
                        </label>
                        <select id="excludePixels" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >                            
                            {excludePixels.map((alg) => (
                                <option key={alg.name} value={alg.name}>{alg.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="rotation" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Rotate Sorting
                        </label>
                        <select id="rotation" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >                            
                            {rotationDegrees.map((alg) => (
                                <option key={alg.name} value={alg.name}>{alg.name}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        type="submit"
                        className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                    >
                        Sort
                    </button>
                </form>
                <img 
                    className="overflow-hidden object-cover w-3/4"
                    id="original"
                    src={editedImageUrl ?? originalImageUrl}
                />
            </div>
        );
    }

    return (
        <>
            <div className="h-screen flex justify-center items-center flex-col gap-8">
                <p className="font-semibold">Upload an image to get started</p>
                <div className="flex  items-center justify-center w-500">
                    <label htmlFor="file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 m-32">
                            <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                        </div>
                        <input id="file" accept="image/png,image/jpeg" className="hidden" type="file" onDrop={e => pixelSortImage(e?.target?.files?.[0])} onDrag={e => e.preventDefault()} onChange={e => pixelSortImage(e?.target?.files?.[0])} />
                    </label>
                </div>
            </div>
            <footer className="bg-white dark:bg-gray-800">
                <div className="px-8 pb-4 flex justify-between">
                    <span className="text-sm text-gray-500 text-center dark:text-gray-400"><a href="https://leiske.dev/" className="hover:underline">Made with love by @leiske</a>
                    </span>
                    <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
                        <li>
                            <a href="#" className="hover:underline me-4 md:me-6">F.A.Q.</a>
                        </li>
                        <li>
                            <a href="mailto:colby@leiske.dev" className="hover:underline">Contact</a>
                        </li>
                    </ul>
                </div>
            </footer>
        </>
    );
}

export default App
