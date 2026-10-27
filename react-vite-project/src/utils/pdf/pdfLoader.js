import {getDocument, GlobalWorkerOptions} from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// pdf.js parses the PDF in a Web Worker; Vite serves the worker file and gives its URL
GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export {getDocument};